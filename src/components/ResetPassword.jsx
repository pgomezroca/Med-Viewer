import { CloudCog } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState(null);
  const apiUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
      verifyToken(tokenParam);
    } else {
      setError('Token no válido');
    }
  }, [searchParams]);

  const verifyToken = async (token) => {
    try {
      const response = await fetch(`${apiUrl}/api/auth/verify-reset-token?token=${token}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Token inválido o expirado');
      }
      const data = await response.json();
      setEmail(data.email);
      setTokenValid(true);
    } catch (error) {
      setTokenValid(false);
      setError(error.response?.data?.message || 'Token inválido o expirado');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
        setError('Las contraseñas no coinciden');
        return;
    }

    if (password.length < 6) {
        setError('La contraseña debe tener al menos 6 caracteres');
        return;
    }

    setLoading(true);
    setError('');

    try {
        const response = await fetch(`${apiUrl}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
        });

        console.log('Response status:', response.status);
        
        if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al restablecer la contraseña');
        }

        const data = await response.json();
                
        setMessage(data.message);
        setTimeout(() => {
        navigate('/password-reset-success');
        }, 2000);
    } catch (error) {
        setError(error.message || 'Error al restablecer la contraseña');
    } finally {
        setLoading(false);
    }
};

  if (tokenValid === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Verificando token...</div>
      </div>
    );
  }

  if (tokenValid === false) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-red-600">
          <p>{error}</p>
          <Link to="/forgot-password" className="text-indigo-600 hover:text-indigo-500">
            Solicitar nuevo enlace
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Restablecer contraseña
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Para: {email}
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <input
              type="password"
              required
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm mb-4"
              placeholder="Nueva contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <input
              type="password"
              required
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Confirmar contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          {message && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
              {message}
            </div>
          )}

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Restableciendo...' : 'Restablecer contraseña'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;