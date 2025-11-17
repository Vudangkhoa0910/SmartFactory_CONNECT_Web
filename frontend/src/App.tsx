import { BrowserRouter as Router, Routes, Route } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";
import Videos from "./pages/UiElements/Videos";
import Images from "./pages/UiElements/Images";
import Alerts from "./pages/UiElements/Alerts";
import Badges from "./pages/UiElements/Badges";
import Avatars from "./pages/UiElements/Avatars";
import Buttons from "./pages/UiElements/Buttons";
import LineChart from "./pages/Charts/LineChart";
import BarChart from "./pages/Charts/BarChart";
import Calendar from "./pages/Calendar";
import BasicTables from "./pages/Tables/BasicTables";
import FormElements from "./pages/Forms/FormElements";
import Blank from "./pages/Blank";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";
import IncidentReportPage from "./pages/Dashboard/IncidentReportPage";
import IncidentQueue from "./pages/ErrorReport/IncidentQueue";
import AllIncidentsPage from "./pages/ErrorReport/AllIncidentsPage";
import AdminInboxPink from "./pages/feedback/AdminInboxPink";
import PublicIdeasPage from "./pages/feedback/PublicIdeasPage";
import KaizenBankPage from "./pages/storage/KaizenBankPage";
import NewIndex from "./pages/news/NewIndex";
import FeedbackDashboard from "./pages/Dashboard/FeedbackDashboard";
import UserList from "./pages/UserManagement/UserList";
import DepartmentList from "./pages/UserManagement/DepartmentList";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <>
      <Router>
        <ScrollToTop />
        <Routes>
          {/* Dashboard Layout */}
          <Route element={<AppLayout />}>
            <Route index path="/" element={<Home />} />

            <Route index path="/incident-queue" element={<IncidentQueue />} />

            <Route
              index
              path="/incident-report-page"
              element={<IncidentReportPage />}
            />

            <Route
              index
              path="/all-incidents-page"
              element={<AllIncidentsPage />}
            />

            <Route
              index
              path="/feadback-dashboard"
              element={<FeedbackDashboard />}
            />

            {/* Feadback */}
            <Route
              index
              path="/admin-inbox-pink"
              element={<AdminInboxPink />}
            />
            <Route
              index
              path="/public-ideas-page"
              element={<PublicIdeasPage />}
            />

            {/* Storage */}
            <Route
              index
              path="/kaizen-bank-page"
              element={<KaizenBankPage />}
            />

            {/* User Management - Admin Only */}
            <Route
              path="/users"
              element={
                <ProtectedRoute requireAdmin>
                  <UserList />
                </ProtectedRoute>
              }
            />

            {/* News */}
            <Route index path="/news" element={<NewIndex />} />

            {/* User Management - Admin Only */}
            <Route 
              path="/users" 
              element={
                <ProtectedRoute requireAdmin>
                  <UserList />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/departments" 
              element={
                <ProtectedRoute requireAdmin>
                  <DepartmentList />
                </ProtectedRoute>
              } 
            />

            {/* Others Page */}
            <Route path="/profile" element={<UserProfiles />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/blank" element={<Blank />} />

            {/* Forms */}
            <Route path="/form-elements" element={<FormElements />} />

            {/* Tables */}
            <Route path="/basic-tables" element={<BasicTables />} />

            {/* Ui Elements */}
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/avatars" element={<Avatars />} />
            <Route path="/badge" element={<Badges />} />
            <Route path="/buttons" element={<Buttons />} />
            <Route path="/images" element={<Images />} />
            <Route path="/videos" element={<Videos />} />

            {/* Charts */}
            <Route path="/line-chart" element={<LineChart />} />
            <Route path="/bar-chart" element={<BarChart />} />
          </Route>

          {/* Auth Layout */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />

          {/* Fallback Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </>
  );
}
