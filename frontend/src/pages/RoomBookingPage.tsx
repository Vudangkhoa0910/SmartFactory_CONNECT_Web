/**
 * ROOM BOOKING PAGE
 * Main page with calendar view for room booking system
 */

import React from 'react';
import PageMeta from '../components/common/PageMeta';
import RoomBookingCalendar from '../components/room-booking/RoomBookingCalendar';
import { useTranslation } from '../contexts/LanguageContext';

const RoomBookingPage: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <>
      <PageMeta
        title={`${t('booking.title')} | SmartFactory CONNECT`}
        description={t('booking.description')}
      />
      <div className="p-4">
        <RoomBookingCalendar />
      </div>
    </>
  );
};

export default RoomBookingPage;
