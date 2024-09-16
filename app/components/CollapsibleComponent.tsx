// CollapsibleComponent.tsx
import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';

interface CollapsibleComponentProps {
  title: string;
  children: React.ReactNode;
  onToggleCollapse: (isCollapsed: boolean) => void; // onToggleCollapse is required
}

const CollapsibleComponent: React.FC<CollapsibleComponentProps> = ({ title, children, onToggleCollapse }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleToggleCollapse = () => {
    const newCollapsedState = !isCollapsed;
    setIsCollapsed(newCollapsedState);
    onToggleCollapse(newCollapsedState); // Pass the collapsed state to parent
  };

  return (
    <div className="relative">
      {!isCollapsed && (
        <div className="p-4 bg-white rounded-lg shadow-md">
          <h3 className="font-bold mb-4">{title}</h3>
          {children}
        </div>
      )}
    </div>
  );
};

export default CollapsibleComponent;
