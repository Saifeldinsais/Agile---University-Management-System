import { useState, useEffect } from "react";
import styles from "./Facilities.module.css";

function DoctorFacilities() {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    // Simulate fetching facilities data
    // In a real app, this would call an API endpoint
    const mockFacilities = [
      {
        id: 1,
        name: "Main Library",
        category: "library",
        description: "Central library with extensive collection of academic resources",
        location: "Building A, Ground Floor",
        hours: "7:00 AM - 10:00 PM",
        contact: "library@university.edu",
        icon: "📚",
      },
      {
        id: 2,
        name: "Computer Lab 1",
        category: "lab",
        description: "State-of-the-art computer lab with modern workstations",
        location: "Building C, 2nd Floor",
        hours: "8:00 AM - 6:00 PM",
        contact: "lab1@university.edu",
        icon: "💻",
      },
      {
        id: 3,
        name: "Computer Lab 2",
        category: "lab",
        description: "Advanced networking and server lab",
        location: "Building C, 3rd Floor",
        hours: "8:00 AM - 6:00 PM",
        contact: "lab2@university.edu",
        icon: "🖥️",
      },
      {
        id: 4,
        name: "Science Lab",
        category: "lab",
        description: "Fully equipped laboratory for physics, chemistry, and biology",
        location: "Building B, 1st Floor",
        hours: "8:00 AM - 5:00 PM",
        contact: "sciencelab@university.edu",
        icon: "🔬",
      },
      {
        id: 5,
        name: "Cafeteria",
        category: "dining",
        description: "Main cafeteria with diverse food options",
        location: "Building A, Basement",
        hours: "6:00 AM - 8:00 PM",
        contact: "cafeteria@university.edu",
        icon: "🍽️",
      },
      {
        id: 6,
        name: "Sports Complex",
        category: "sports",
        description: "Gymnasium, swimming pool, and sports courts",
        location: "Sports Wing",
        hours: "6:00 AM - 9:00 PM",
        contact: "sports@university.edu",
        icon: "⚽",
      },
      {
        id: 7,
        name: "Auditorium",
        category: "auditorium",
        description: "Large auditorium for seminars, conferences, and events",
        location: "Building D",
        hours: "Variable (Book in advance)",
        contact: "auditorium@university.edu",
        icon: "🎤",
      },
      {
        id: 8,
        name: "Medical Center",
        category: "medical",
        description: "Health center with medical staff and basic medical facilities",
        location: "Building E, Ground Floor",
        hours: "8:00 AM - 5:00 PM",
        contact: "medical@university.edu",
        icon: "⚕️",
      },
      {
        id: 9,
        name: "Student Counseling Center",
        category: "support",
        description: "Counseling and advisory services for students",
        location: "Building F, 2nd Floor",
        hours: "9:00 AM - 5:00 PM",
        contact: "counseling@university.edu",
        icon: "💬",
      },
      {
        id: 10,
        name: "IT Support",
        category: "support",
        description: "Technical support for hardware, software, and networking issues",
        location: "Building C, Ground Floor",
        hours: "8:00 AM - 6:00 PM",
        contact: "itsupport@university.edu",
        icon: "🔧",
      },
    ];

    setTimeout(() => {
      setFacilities(mockFacilities);
      setLoading(false);
    }, 500);
  }, []);

  const categories = [
    { value: "all", label: "All Facilities" },
    { value: "library", label: "Libraries" },
    { value: "lab", label: "Laboratories" },
    { value: "dining", label: "Dining" },
    { value: "sports", label: "Sports" },
    { value: "auditorium", label: "Auditorium" },
    { value: "medical", label: "Medical" },
    { value: "support", label: "Support Services" },
  ];

  const filteredFacilities =
    selectedCategory === "all"
      ? facilities
      : facilities.filter((f) => f.category === selectedCategory);

  return (
    <div className={styles.facilitiesContainer}>
      {/* Header */}
      <div className={styles.headerSection}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>University Facilities</h1>
          <p className={styles.subtitle}>
            Explore and manage your access to all university facilities and resources
          </p>
        </div>
      </div>

      {/* Category Filter */}
      <div className={styles.filterSection}>
        <h2 className={styles.filterTitle}>Filter by Category</h2>
        <div className={styles.categoryButtons}>
          {categories.map((cat) => (
            <button
              key={cat.value}
              className={`${styles.categoryButton} ${
                selectedCategory === cat.value ? styles.active : ""
              }`}
              onClick={() => setSelectedCategory(cat.value)}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className={styles.loadingBox}>Loading facilities...</div>
      ) : filteredFacilities.length === 0 ? (
        <div className={styles.emptyBox}>
          <p>No facilities found in this category.</p>
        </div>
      ) : (
        <div className={styles.facilitiesGrid}>
          {filteredFacilities.map((facility) => (
            <div key={facility.id} className={styles.facilityCard}>
              <div className={styles.cardIcon}>{facility.icon}</div>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>{facility.name}</h3>
                <span className={styles.cardCategory}>{facility.category}</span>
              </div>

              <p className={styles.cardDescription}>{facility.description}</p>

              <div className={styles.cardDetails}>
                <div className={styles.detailItem}>
                  <span className={styles.detailIcon}>📍</span>
                  <div className={styles.detailContent}>
                    <span className={styles.detailLabel}>Location</span>
                    <span className={styles.detailValue}>{facility.location}</span>
                  </div>
                </div>

                <div className={styles.detailItem}>
                  <span className={styles.detailIcon}>🕐</span>
                  <div className={styles.detailContent}>
                    <span className={styles.detailLabel}>Hours</span>
                    <span className={styles.detailValue}>{facility.hours}</span>
                  </div>
                </div>

                <div className={styles.detailItem}>
                  <span className={styles.detailIcon}>📧</span>
                  <div className={styles.detailContent}>
                    <span className={styles.detailLabel}>Contact</span>
                    <span className={styles.detailValue}>{facility.contact}</span>
                  </div>
                </div>
              </div>

              <button className={styles.cardButton}>Learn More</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default DoctorFacilities;
