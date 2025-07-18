import { Outlet } from "react-router-dom";

export default function CityLayout() {
  return (
    <div className="city-container h-full w-full">
      {/* Optional shared UI */}
      <Outlet />
    </div>
  );
}
