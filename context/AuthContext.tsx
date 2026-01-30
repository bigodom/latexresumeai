import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  email: string;
  name: string;
  credits: number;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  loginAsTestUser: () => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simular verificação de sessão ao carregar
    const storedUser = localStorage.getItem('latexResumeUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    // Simular delay de API
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Validação mock simples
    if (!email || !password) throw new Error("Preencha todos os campos");
    
    // Usuários normais começam com 0 créditos na demo, a menos que comprem
    const mockUser = { email, name: email.split('@')[0], credits: 0 };
    setUser(mockUser);
    localStorage.setItem('latexResumeUser', JSON.stringify(mockUser));
  };

  const register = async (name: string, email: string, password: string) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (!name || !email || !password) throw new Error("Preencha todos os campos");
    
    const newUser = { name, email, credits: 0 };
    setUser(newUser);
    localStorage.setItem('latexResumeUser', JSON.stringify(newUser));
  };

  const loginAsTestUser = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const testUser = { 
        name: "Desenvolvedor Teste", 
        email: "dev@teste.com", 
        credits: 1000 
    };
    
    setUser(testUser);
    localStorage.setItem('latexResumeUser', JSON.stringify(testUser));
    setIsLoading(false);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('latexResumeUser');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, loginAsTestUser, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};