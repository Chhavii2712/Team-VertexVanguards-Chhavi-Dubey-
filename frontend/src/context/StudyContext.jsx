import React, { createContext, useContext, useState, useEffect } from 'react';

const StudyContext = createContext();

export const StudyProvider = ({ children }) => {
  const [student, setStudent] = useState(() => {
    const saved = localStorage.getItem('studyloop_student');
    return saved ? JSON.parse(saved) : {
      name: 'Student',
      registration: '',
      joiningYear: '2024',
      residence: 'Hosteller',
      branch: 'B.Tech CSE (AI & ML)',
      branchCode: 'BAI'
    };
  });

  const [selectedCourses, setSelectedCourses] = useState(() => {
    const saved = localStorage.getItem('studyloop_courses');
    return saved ? JSON.parse(saved) : [];
  });

  const [chosenTimetable, setChosenTimetable] = useState(() => {
    const saved = localStorage.getItem('studyloop_timetable');
    return saved ? JSON.parse(saved) : null;
  });

  const [lifestyle, setLifestyle] = useState(() => {
    const saved = localStorage.getItem('studyloop_lifestyle');
    return saved ? JSON.parse(saved) : {
      wake_up_time: '07:00',
      sleep_time: '23:00',
      study_hours: 4,
      meal_timings: ['08:00', '13:00', '20:00'],
      gym_preference: true,
      club_activities: [],
      travel_time: 30
    };
  });

  const [deadlines, setDeadlines] = useState(() => {
    const saved = localStorage.getItem('studyloop_deadlines');
    return saved ? JSON.parse(saved) : [];
  });

  const [dailyPlan, setDailyPlan] = useState(() => {
    const saved = localStorage.getItem('studyloop_daily_plan');
    return saved ? JSON.parse(saved) : [];
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('studyloop_student', JSON.stringify(student));
  }, [student]);

  useEffect(() => {
    localStorage.setItem('studyloop_courses', JSON.stringify(selectedCourses));
  }, [selectedCourses]);

  useEffect(() => {
    localStorage.setItem('studyloop_timetable', JSON.stringify(chosenTimetable));
  }, [chosenTimetable]);

  useEffect(() => {
    localStorage.setItem('studyloop_lifestyle', JSON.stringify(lifestyle));
  }, [lifestyle]);

  useEffect(() => {
    localStorage.setItem('studyloop_deadlines', JSON.stringify(deadlines));
  }, [deadlines]);

  useEffect(() => {
    localStorage.setItem('studyloop_daily_plan', JSON.stringify(dailyPlan));
  }, [dailyPlan]);

  return (
    <StudyContext.Provider value={{
      student, setStudent,
      selectedCourses, setSelectedCourses,
      chosenTimetable, setChosenTimetable,
      lifestyle, setLifestyle,
      deadlines, setDeadlines,
      dailyPlan, setDailyPlan
    }}>
      {children}
    </StudyContext.Provider>
  );
};

export const useStudy = () => useContext(StudyContext);
