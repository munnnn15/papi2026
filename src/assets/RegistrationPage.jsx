import React from 'react';
import { useNavigate } from 'react-router-dom';
// import GuestForm from '../components/GuestForm'; // Asumsi path ini benar

// --- Placeholder GuestForm untuk demonstrasi ---
// Anda bisa mengganti ini dengan import GuestForm Anda yang sebenarnya
const GuestForm = ({ onSuccess }) => {
  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <p className="mb-4 text-center text-gray-600">Ini adalah placeholder untuk komponen <strong>GuestForm.jsx</strong> Anda.</p>
      <button onClick={() => onSuccess(123)} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold p-3 rounded-lg transition-colors">
        Submit & Dapatkan Tiket (Contoh)
      </button>
    </div>
  );
};
// --- Akhir Placeholder ---

function RegistrationPage() {
  const navigate = useNavigate();

  const handleSuccess = (newAttendeeId) => {
    navigate(`/ticket/${newAttendeeId}`);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">Registrasi Tamu</h1>
        <GuestForm onSuccess={handleSuccess} />
      </div>
    </div>
  );
}

export default RegistrationPage;