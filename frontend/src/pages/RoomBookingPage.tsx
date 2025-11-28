/**
 * ROOM BOOKING PAGE
 * Main page with calendar view for room booking system
 */

import React from 'react';
import RoomBookingCalendar from '../components/room-booking/RoomBookingCalendar';

const RoomBookingPage: React.FC = () => {
  return (
    <div className="p-6">
      <RoomBookingCalendar />
    </div>
  );
};

export default RoomBookingPage;
