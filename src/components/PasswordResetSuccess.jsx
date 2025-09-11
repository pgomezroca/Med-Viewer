import { Link } from 'react-router-dom';

const PasswordResetSuccess = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          <h2 className="text-2xl font-bold mb-4">¡Contraseña restablecida!</h2>
          <p>Tu contraseña ha sido actualizada correctamente.</p>
        </div>
        
        <Link
          to="/login"
          className="inline-block bg-indigo-600 px-4 py-2 rounded-md hover:bg-indigo-700"
        >
          Iniciar sesión
        </Link>
      </div>
    </div>
  );
};

export default PasswordResetSuccess;