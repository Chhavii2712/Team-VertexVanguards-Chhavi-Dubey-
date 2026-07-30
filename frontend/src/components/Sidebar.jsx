// Shared sidebar layout used by all inner pages
import { NavLink } from 'react-router-dom'

const navItems = [
  { icon: '🏠', label: 'Dashboard', to: '/dashboard', section: 'OVERVIEW' },
  { icon: '📅', label: 'Daily Planner', to: '/planner', section: null },
  { icon: '⏰', label: 'Deadlines', to: '/deadlines', section: null },
  { icon: '📖', label: 'Study Assistant', to: '/study', section: 'TOOLS' },
  { icon: '💬', label: 'Chat', to: '/chat', section: null },
  { icon: '🗓️', label: 'Timetable', to: '/timetable', section: 'SETUP' },
  { icon: '📚', label: 'Courses', to: '/course-selection', section: null },
]

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">🎓</div>
        <span>StudyLoop</span>
      </div>
      {navItems.map((item, i) => (
        <div key={i}>
          {item.section && <div className="nav-section-label">{item.section}</div>}
          <NavLink
            to={item.to}
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </NavLink>
        </div>
      ))}
    </aside>
  )
}
