// UserProfile.tsx
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faSignOutAlt, faCog } from '@fortawesome/free-solid-svg-icons';
import { useState } from 'react';

export default function UserProfile() {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <div className="relative">
      {/* User Icon */}
      <FontAwesomeIcon
        icon={faUser}
        className="text-3xl cursor-pointer text-[#5942E9] hover:text-blue-700"
        onClick={toggleMenu}
      />

      {/* Dropdown Menu */}
      {menuOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-lg py-2">
          <a href="/settings" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
            <FontAwesomeIcon icon={faCog} className="mr-2 text-[#5942E9]" />
            Settings
          </a>
          <a href="/logout" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
            <FontAwesomeIcon icon={faSignOutAlt} className="mr-2 text-[#5942E9]" />
            Log Out
          </a>
        </div>
      )}
    </div>
  );
}
