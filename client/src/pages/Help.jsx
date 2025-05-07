import { useNavigate } from 'react-router-dom';

const Help = () => {
  const navigate = useNavigate();

  const faqs = [
    {
      question: "How do I mark my attendance?",
      answer: "To mark your attendance, click on the 'Scan QR' button either from the dashboard or quick actions menu. When your lecturer displays the QR code, scan it using your device's camera to record your attendance for that session."
    },
    {
      question: "How do I enroll in courses?",
      answer: "You can enroll in courses through two methods: 1) Click the 'Enroll' button in quick actions to access course enrollment. 2) When it's time for semester enrollment, use the 'Next Semester Enrollment' option in the Current Enrollment section."
    },
    {
      question: "Where can I view my attendance history?",
      answer: "Your attendance history can be accessed by clicking the 'History' button in quick actions. This shows all your past attendance records across all enrolled courses."
    },
    {
      question: "What should I do if the QR code scan fails?",
      answer: "If the QR code scan fails, try the following: 1) Ensure good lighting conditions 2) Hold your device steady 3) Make sure you're within the session time window 4) If problems persist, contact your lecturer immediately."
    },
    {
      question: "How can I check my current enrollment status?",
      answer: "Your current enrollment status is displayed in the 'Current Enrollment' section of the dashboard, showing your current semester, program year, and enrolled courses."
    }
  ];

  const contactInfo = {
    technical: {
      title: "Technical Support",
      email: "support@university.edu",
      hours: "Monday-Friday, 8:00 AM - 5:00 PM"
    },
    academic: {
      title: "Academic Affairs",
      email: "academic@university.edu",
      hours: "Monday-Friday, 9:00 AM - 4:00 PM"
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-indigo-50 to-blue-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex items-center mb-8">
            <button
              onClick={() => navigate("/student")}
              className="mr-4 p-2 hover:bg-gray-100 rounded-full transition duration-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <h1 className="text-3xl font-bold text-gray-800">Help Center</h1>
          </div>

          {/* Quick Guide Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Guide</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <p className="text-blue-800">
                Welcome to the Lecture Attendance System! This system helps you manage your course attendance easily.
                Use the QR code scanner to mark your attendance, check your history, and manage your course enrollments
                all in one place.
              </p>
            </div>
          </div>

          {/* FAQs Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div key={index} className="border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-2">{faq.question}</h3>
                  <p className="text-gray-600">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Need More Help?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.values(contactInfo).map((contact, index) => (
                <div key={index} className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-2">{contact.title}</h3>
                  <div className="space-y-2">
                    <p className="text-gray-600">
                      <span className="font-medium">Email:</span> {contact.email}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">Hours:</span> {contact.hours}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Help;