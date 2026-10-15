import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import RegistrationPage from './RegistrationPage';
import TicketPage from './TicketPage';
import RafflePage from './Raffle';
import SummaryPage from './SummaryPage';

function App() {
  return (
    <Router>
      <Routes>
        {/* Rute untuk form registrasi tamu */}
        <Route path="/" element={<RegistrationPage />} />

        {/* Rute untuk menampilkan tiket setelah sukses registrasi */}
        <Route path="/ticket/:id" element={<TicketPage />} />

        {/* Rute khusus panitia untuk melakukan undian */}
        <Route path="/raffle" element={<RafflePage />} />

        {/* Ringkasan statistik kehadiran tanpa data pribadi peserta */}
        <Route path="/summary" element={<SummaryPage />} />
      </Routes>
    </Router>
  );
}

export default App;
