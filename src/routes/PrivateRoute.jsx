import { Navigate } from "react-router-dom"

const PrivateRoute = ({ children }) => {
  const storedUser = localStorage.getItem("usuario")

  if (!storedUser) {
    return <Navigate to="/login" replace />
  }

  try {
    const parsedUser = JSON.parse(storedUser)

    if (!parsedUser.user || !parsedUser.user.nombre) {
      return <Navigate to="/login" replace />
    }

    return children
  } catch  {
    return <Navigate to="/login" replace />
  }
}

export default PrivateRoute
