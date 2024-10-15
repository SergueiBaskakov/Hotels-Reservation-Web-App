import { Route, Navigate } from 'react-router-dom';

const PrivateRoute = ({ children, user, requiredRole, ...rest }) => (
  <Route
    {...rest}
    render={({ location }) =>
      user && user.role === requiredRole ? (
        children
      ) : (
        <Navigate
          to={{
            pathname: '/UserPage',
            state: { from: location },
          }}
        />
      )
    }
  />
);

export default PrivateRoute;
