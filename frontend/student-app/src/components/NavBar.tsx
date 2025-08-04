import { useNavigate } from "react-router-dom"

export function NavBar() {
    const navigate = useNavigate();

    return (
        <nav
        style={{
          backgroundColor: '#3a87b5',
          position: 'fixed',
          padding: '10px',
          top: 0, left: 0,
          width: '100%', boxSizing: 'border-box',

          display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '10px',
          height: '70px'
        }}
      >
        <img src={'./Seal_of_Andres_Bonifacio_College.png'} style={{height: '50px'}}></img>
        <p>Andres Bonifacio College - QRAS</p>

        <button
            style={{ marginLeft: 'auto', border: 'none' }}
            onClick={() => navigate('/about')}
            >
                About</button>
      </nav>
    )
}