// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navigation from './components/Navigation';
import HomePage from './pages/HomePage';
import CoursesPage from './pages/CoursesPage';
import './styles/App.less';

const App: React.FC = () => {
  return (
    <Router>
      <div className="app">
        <Navigation />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/courses" element={<CoursesPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;