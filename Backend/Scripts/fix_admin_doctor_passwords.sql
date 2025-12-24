-- Run this in phpMyAdmin or MySQL Workbench to fix admin and doctor passwords
UPDATE entity_attribute SET value_string = '$2b$10$Wr6t9g/49Q5LtgTWGLj9CeQ6E7pISBVCpxplzuFopuP4wSiXy9AFK' WHERE entity_id = 8 AND attribute_id = 2;
UPDATE entity_attribute SET value_string = '$2b$10$Wr6t9g/49Q5LtgTWGLj9CeQ6E7pISBVCpxplzuFopuP4wSiXy9AFK' WHERE entity_id = 9 AND attribute_id = 2;
SELECT entity_id, value_string FROM entity_attribute WHERE entity_id IN (8, 9) AND attribute_id = 2;
