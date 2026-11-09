import React from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';

import { Dashboard, JobDetails, Profile, Signin, Signup, Companies, Error, Statistics, Notifications } from './pages';
import { Header } from './components';

const App = () => {
  const location = useLocation()

  return (
      <Routes>
        <Route path="/" element={<Signin location={location} />} />
        <Route path="/signup" element={<Signup location={location} />} />
        <Route
          path="*"
          element={
            <>
              <Header />
              <main className="relative flex flex-col justify-start w-full bg-[#f9fafe] dark:bg-gray-950 min-h-[calc(100vh-73px)]">
                <Routes>
                  <Route path="/dashboard" element={<Dashboard location={location}/>} />
                  <Route path="/job/:id" element={<JobDetails location={location}/>} />
                  <Route path="/profile" element={<Profile location={location}/>} />
                  <Route path="/companies" element={<Companies location={location}/>} />
                  <Route path="/statistics" element={<Statistics location={location}/>} />
                  <Route path="/notifications" element={<Notifications location={location}/>} />
                  <Route path="*" element={<Error />} />
                </Routes>
              </main>
            </>
          }
        />
      </Routes>
  );
};

export default App;