import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const StudentList = ({ organizationId }) => {
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('');

  // Mock data for now - replace with actual API calls
  const mockStudents = [
    {
      id: 1,
      name: 'John Doe',
      email: 'john.doe@example.com',
      class: 'Class 10A',
      rollNumber: 'ST001',
      phone: '+1234567890',
      status: 'active'
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      class: 'Class 10B',
      rollNumber: 'ST002',
      phone: '+1234567891',
      status: 'active'
    }
  ];

  const fetchStudents = async () => {
    try {
      setIsLoading(true);
      // Replace with actual API call
      // const response = await axios.get(`/api/students?organizationId=${organizationId}`);
      // setStudents(response.data);
      setStudents(mockStudents);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to fetch students');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [organizationId]);

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = !selectedClass || student.class === selectedClass;
    return matchesSearch && matchesClass;
  });

  const inputBaseClass = "w-full bg-slate-100 border-slate-200 rounded-md p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none";
  const btnBaseClass = "font-semibold px-4 py-2 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors";

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Student Management</h2>
          <p className="text-slate-500 text-sm">Manage student information and records</p>
        </div>
        <button className={`${btnBaseClass} bg-indigo-500 hover:bg-indigo-600 text-white`}>
          <i className="fas fa-plus"></i>
          Add Student
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Search</label>
          <input
            type="text"
            placeholder="Search by name, email, or roll number..."
            className={inputBaseClass}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Class</label>
          <select
            className={inputBaseClass}
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
          >
            <option value="">All Classes</option>
            <option value="Class 10A">Class 10A</option>
            <option value="Class 10B">Class 10B</option>
            <option value="Class 11A">Class 11A</option>
            <option value="Class 11B">Class 11B</option>
          </select>
        </div>
        <div className="flex items-end">
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedClass('');
            }}
            className={`${btnBaseClass} bg-slate-200 hover:bg-slate-300 text-slate-800 w-full`}
          >
            <i className="fas fa-times"></i>
            Clear Filters
          </button>
        </div>
      </div>

      {/* Students Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="ml-3 text-slate-600">Loading students...</span>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-100 text-slate-600">
                <th className="p-3 text-left font-semibold">Name</th>
                <th className="p-3 text-left font-semibold">Email</th>
                <th className="p-3 text-left font-semibold">Class</th>
                <th className="p-3 text-left font-semibold">Roll Number</th>
                <th className="p-3 text-left font-semibold">Phone</th>
                <th className="p-3 text-left font-semibold">Status</th>
                <th className="p-3 text-center font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => (
                <tr key={student.id} className="border-b border-slate-200 hover:bg-slate-50">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-300 rounded-full flex items-center justify-center">
                        <i className="fas fa-user text-slate-600 text-sm"></i>
                      </div>
                      <span className="font-medium text-slate-900">{student.name}</span>
                    </div>
                  </td>
                  <td className="p-3 text-slate-600">{student.email}</td>
                  <td className="p-3">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                      {student.class}
                    </span>
                  </td>
                  <td className="p-3 text-slate-600">{student.rollNumber}</td>
                  <td className="p-3 text-slate-600">{student.phone}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-sm ${
                      student.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {student.status}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Edit Student"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Student"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center p-8 text-slate-500">
                    No students found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default StudentList;
