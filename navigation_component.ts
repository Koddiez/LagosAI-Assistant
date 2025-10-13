// src/components/Navigation.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Navigation.less';

const Navigation: React.FC = () => {
  return (
    <nav className="navigation">
      <div className="nav-brand">
        <Link to="/">BlockBridge Academy</Link>
      </div>
      <ul className="nav-links">
        <li><Link to="/">Home</Link></li>
        <li><Link to="/courses">Courses</Link></li>
      </ul>
    </nav>
  );
};

export default Navigation;