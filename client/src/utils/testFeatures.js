import { lecturerAPI } from '../services/api';

export const testFeatures = async () => {
  const results = {
    lecturerManagement: false,
    reports: false,
    bulkOperations: false
  };

  try {
    // Test 1: Create Lecturer
    const testLecturer = {
      name: "Test Lecturer",
      email: "test@university.edu",
      department: "Computer Science",
      employmentStatus: "FULL_TIME",
      specialization: "Testing"
    };

    const createResponse = await lecturerAPI.create(testLecturer);
    console.log("Create Lecturer Test:", createResponse.data);
    results.lecturerManagement = true;

    // Test 2: Get All Lecturers
    const getLecturers = await lecturerAPI.getAll();
    console.log("Get Lecturers Test:", getLecturers.data);

    // Test 3: Bulk Import
    const bulkData = [
      {
        name: "Bulk Test 1",
        email: "bulk1@university.edu",
        department: "Mathematics",
        employmentStatus: "FULL_TIME"
      },
      {
        name: "Bulk Test 2",
        email: "bulk2@university.edu",
        department: "Physics",
        employmentStatus: "PART_TIME"
      }
    ];

    const bulkResponse = await lecturerAPI.bulkImport(bulkData);
    console.log("Bulk Import Test:", bulkResponse.data);
    results.bulkOperations = true;

    return results;
  } catch (error) {
    console.error("Test Failed:", error);
    return results;
  }
}; 