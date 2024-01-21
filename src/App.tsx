import React, { useState, useEffect } from "react";
import axios from "axios";

interface Appointment {
  time: string;
  name: string;
}

function App() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const getCurrentDate = (): string => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };
  const [selectedDate, setSelectedDate] = useState<string>(getCurrentDate());

  useEffect(() => {
    fetchAppointments();
  }, []);
  useEffect(() => {
    fetchAvailableSlots(selectedDate);
  }, [appointments, selectedDate]);
  const fetchAppointments = async () => {
    try {
      const response = await axios.get<Appointment[]>(
        "http://localhost:3000/api/appointments",
      );
      setAppointments(response.data);
    } catch (error) {
      console.error("Error fetching appointments", error);
    }
  };

  const fetchAvailableSlots = (date: string) => {
    const existingAppointments = appointments.map((appt) => appt.time);
    const allSlots = Array.from({ length: 24 }, (_, index) => `${index}:00`);
    const available = allSlots.filter(
      (slot) => !existingAppointments.includes(`${date} ${slot}`),
    );
    setAvailableSlots(available);
  };

  const handleAppointmentSubmit = async () => {
    try {
      const response = await axios.post<Appointment>(
        "http://localhost:3000/api/appointments",
        {
          time: `${selectedDate} ${selectedTime}`,
          name: userName,
        },
      );
      setAppointments([...appointments, response.data]);
      setAvailableSlots(availableSlots.filter((slot) => slot !== selectedTime));
      setSelectedTime("");
      setUserName("");
    } catch (error) {
      console.error("Error scheduling appointment", error);
    }
  };

  const handleAppointmentCancel = async (time: string) => {
    try {
      await axios.delete(`http://localhost:3000/api/appointments/${time}`);
      setAppointments(appointments.filter((appt) => appt.time !== time));

      const [date, slot] = time.split(" ");
      console.log(date, slot, selectedDate, date === selectedDate);
      if (date === selectedDate) {
        console.log("HERE", availableSlots);
        setAvailableSlots([...availableSlots, slot]);
      }
    } catch (error) {
      console.error("Error cancelling appointment", error);
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setSelectedDate(newDate);
    fetchAvailableSlots(newDate);
  };

  return (
    <div className="App">
      <h1>Scheduling Platform</h1>
      <div>
        <h2>Select Date</h2>
        <input type="date" value={selectedDate} onChange={handleDateChange} />
      </div>
      <div>
        <h2>Available Time Slots</h2>
        <select
          value={selectedTime}
          onChange={(e) => setSelectedTime(e.target.value)}
        >
          <option value="">Select a time</option>
          {availableSlots.map((slot) => (
            <option key={slot} value={slot}>
              {slot}
            </option>
          ))}
        </select>
      </div>
      <div>
        <h2>Scheduled Appointments</h2>
        <ul>
          {appointments.map((appt) => (
            <li key={appt.time}>
              {appt.time} - {appt.name}
              <button onClick={() => handleAppointmentCancel(appt.time)}>
                Cancel
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h2>Schedule an Appointment</h2>
        <label>
          Name:
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
          />
        </label>
        <button
          onClick={handleAppointmentSubmit}
          disabled={!selectedTime || !userName}
        >
          Schedule
        </button>
      </div>
    </div>
  );
}

export default App;
