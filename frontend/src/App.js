import './App.css';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import LandingPage from './pages/landing';
import Authentication from './pages/authentication';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import VideoMeetComponent from './pages/VideoMeet';
import HomeComponent from './pages/home';
import History from './pages/history';

import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';

function App() {
  return (
    <div className="App">
      <Router>
        <ThemeProvider>
          <AuthProvider>
            <Routes>
              <Route path='/' element={<LandingPage />} />
              <Route path='/auth' element={<Authentication />} />

              <Route path='/home' element={
                <>
                  <SignedIn><HomeComponent /></SignedIn>
                  <SignedOut><RedirectToSignIn /></SignedOut>
                </>
              } />
              <Route path='/history' element={
                <>
                  <SignedIn><History /></SignedIn>
                  <SignedOut><RedirectToSignIn /></SignedOut>
                </>
              } />
              <Route path='/:url' element={
                <>
                  <SignedIn><VideoMeetComponent /></SignedIn>
                  <SignedOut><RedirectToSignIn /></SignedOut>
                </>
              } />
            </Routes>
          </AuthProvider>
        </ThemeProvider>
      </Router>
    </div>
  );
}

export default App;
