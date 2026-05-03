import React, { useEffect } from 'react';
import { useHandleSignInCallback } from '@logto/react';
import { useNavigate } from 'react-router-dom';
import { NeonorteLoader } from '@/components/ui/NeonorteLoader';

const CallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const { isLoading, error } = useHandleSignInCallback(() => {
    // Navigate to root after successful callback
    navigate('/', { replace: true });
  });

  useEffect(() => {
    if (error) {
      console.error('Logto callback error:', error);
      alert(`Falha na autenticação: ${error.message}`);
      navigate('/login', { replace: true });
    }
  }, [error, navigate]);

  return (
    <NeonorteLoader
      size="fullscreen"
      message={isLoading ? "Validando identidade Ywara..." : "Redirecionando..."}
      overlay={false}
    />
  );
};

export default CallbackPage;
