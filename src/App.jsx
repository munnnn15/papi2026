import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import RegistrationPage from './RegistrationPage';
import TicketPage from './TicketPage';
import RafflePage from './Raffle';

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
      </Routes>
    </Router>
  );
}

export default App;
