'use client'
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FILTER_OPTIONS } from "@/utils/dateFilters";

const FilterBar = ({
  selectedFilter,
  setSelectedFilter,
  customRange,
  setCustomRange,
}) => {

  const handleStartDateChange = (date) => {
    setCustomRange([date, customRange[1]]);
  };

  const handleEndDateChange = (date) => {
    setCustomRange([customRange[0], date]);
  };

  return (
    <div className="flex flex-col gap-4 mb-6">
      {/* Filter & Visitor Section */}
      <div className="flex flex-wrap gap-4 items-center">
        {/* Filter Dropdown */}
        <select
          value={selectedFilter}
          onChange={(e) => setSelectedFilter(e.target.value)}
          className="px-4 py-2 rounded-xl border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          {FILTER_OPTIONS.map((option) => (
            <option key={option.key} value={option.key}>
              {option.label}
            </option>
          ))}
        </select>

      </div>

      {/* Custom Date Range Picker */}
      {selectedFilter === "custom" && (
        <div className="flex flex-wrap items-center gap-4 bg-gray-100 px-4 py-3 rounded-xl shadow-sm border border-gray-200">
          {/* Start Date */}
          <div className="flex flex-col items-start">
            <label className="text-sm font-medium text-gray-700 mb-1">
              From
            </label>
            <DatePicker
              selected={customRange[0]}
              onChange={handleStartDateChange}
              selectsStart
              startDate={customRange[0]}
              endDate={customRange[1]}
              dateFormat="dd MMM yyyy"
              className="px-2 py-1 border border-gray-300 rounded-md text-sm w-36"
              placeholderText="Select start date"
              isClearable
            />
          </div>

          {/* End Date */}
          <div className="flex flex-col items-start">
            <label className="text-sm font-medium text-gray-700 mb-1">To</label>
            <DatePicker
              selected={customRange[1]}
              onChange={handleEndDateChange}
              selectsEnd
              startDate={customRange[0]}
              endDate={customRange[1]}
              minDate={customRange[0]}
              dateFormat="dd MMM yyyy"
              className="px-2 py-1 border border-gray-300 rounded-md text-sm w-36"
              placeholderText="Select end date"
              isClearable
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterBar;
