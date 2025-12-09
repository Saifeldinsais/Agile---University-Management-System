const entity = require("../EAV models/Entity");
const attribute = require("../EAV models/Attribute");
const value = require("../EAV models/Value");
const bcrypt = require("bcryptjs");
const JWT = require("jsonwebtoken");

let attributesInitialized = false;
const initializeAttributes = async () => {
  if (attributesInitialized) return;
  
  try {
    const emailAttr = await attribute.getAttributeByName("email");
    if (!emailAttr) {
      await attribute.create("email", "string");
      console.log("Created email attribute");
    }
    
    const passwordAttr = await attribute.getAttributeByName("password");
    if (!passwordAttr) {
      await attribute.create("password", "string");
      console.log("Created password attribute");
    }
    
    const usernameAttr = await attribute.getAttributeByName("username");
    if (!usernameAttr) {
      await attribute.create("username", "string");
      console.log("Created username attribute");
    }
    
    attributesInitialized = true;
    console.log("Attributes initialized");
  } catch (error) {
    console.error("Error initializing attributes:", error.message);
  }
};


const userAuthService = {
    // Simple register
    registerUser: async (userData) => {
        try {

            await initializeAttributes();
            const { email, password, confirmPassword, username, userType } = userData;

            // Validate
            if (!email || !password || !confirmPassword || !username) {
                throw new Error("All fields required");
            }

            if (password !== confirmPassword) {
                throw new Error("Passwords don't match");
            }

            // Check if email exists
            const existing = await entity.findByAttribute("email", email);
            if (existing) {
                throw new Error("Email already exists");
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Create entity
            const userId = await entity.create(userType, username);

            // Get attribute IDs
            const emailAttr = await attribute.getAttributeByName("email");
            const passwordAttr = await attribute.getAttributeByName("password");
            const usernameAttr = await attribute.getAttributeByName("username");

            // Store values
            await value.createValue(userId, emailAttr.attribute_id, { value_string: email });
            await value.createValue(userId, passwordAttr.attribute_id, { value_string: hashedPassword });
            await value.createValue(userId, usernameAttr.attribute_id, { value_string: username });

            return { success: true, userId, message: "Registered successfully" };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    // Simple login
    loginUser: async (credentials) => {
        try {
            await initializeAttributes();
            const { email, password } = credentials;

            if (!email || !password) {
                throw new Error("Email and password required");
            }

            // Find user
            const user = await entity.findByAttribute("email", email);
            if (!user) {
                throw new Error("Invalid email or password");
            }

            // Get password
            const passwordAttr = await attribute.getAttributeByName("password");
            const storedPassword = await value.getValue(user.entity_id, passwordAttr.attribute_id);

            // Compare
            const isMatch = await bcrypt.compare(password, storedPassword.value_string);
            if (!isMatch) {
                throw new Error("Invalid email or password");
            }

            // Create token
            const token = JWT.sign(
                { id: user.entity_id, email },
                process.env.JWT_SECRET || "secret",
                { expiresIn: "7d" }
            );

            return { success: true, token, userId: user.entity_id, email };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }
};

module.exports = userAuthService;