import Sidebar from "../../components/Sidebar/Sidebar";
import Navbar from "../../components/Navbar/Navbar";
import "./MainLayout.css";

type MainLayoutProps = {
  children: React.ReactNode;
};

function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="main-layout">
      <Sidebar />

      <div className="main-layout-content">
        <Navbar />

        <main className="main-layout-main">
          {children}
        </main>
      </div>
    </div>
  );
}

export default MainLayout;