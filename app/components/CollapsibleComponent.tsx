import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';

interface CollapsibleComponentProps {
  title: string;
  children: React.ReactNode;
  onToggleCollapse: (isCollapsed: boolean) => void; // onToggleCollapse is required
  titleStyle?: React.CSSProperties; // Add titleStyle prop to customize title appearance
}

const CollapsibleComponent: React.FC<CollapsibleComponentProps> = ({ title, children, onToggleCollapse, titleStyle }) => {
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
          {/* Apply custom style to the title */}
          <h3 className="font-bold mb-4" style={titleStyle}>
            {title}
          </h3>
          {children}
        </div>
      )}

      {/* Toggle Button */}
      {/* <button
        onClick={handleToggleCollapse}
        className="absolute top-4 right-4 p-2 bg-gray-200 rounded-full shadow hover:bg-gray-300 transition-all"
      >
        <FontAwesomeIcon icon={isCollapsed ? faChevronRight : faChevronLeft} />
      </button> */}
    </div>
  );
};

export default CollapsibleComponent;
