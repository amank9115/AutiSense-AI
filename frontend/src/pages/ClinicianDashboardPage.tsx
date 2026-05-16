import DoctorDashboardPage from "./DoctorDashboardPage"
import { GetServerSideProps } from "next"

const ClinicianDashboardPage = () => {
  return <DoctorDashboardPage />
}

export default ClinicianDashboardPage

export const getServerSideProps: GetServerSideProps = async () => {
  return { props: {} }
}
