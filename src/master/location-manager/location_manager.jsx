import {
  CountryTable,
  StateTable,
  DistrictTable,
  SyllabusTable,
  StatsCards,
} from "../../components/master-user/location-manager";
import { useLocationManager } from "./useLocationManager";

function LocationManager() {
  const {
    countries,
    states,
    districts,
    syllabi,
    selectedCountry,
    selectedState,
    isLoadingCountries,
    isLoadingStates,
    isLoadingDistricts,
    isLoadingSyllabi,
    handleAddCountry,
    handleEditCountry,
    handleDeleteCountry,
    handleAddState,
    handleEditState,
    handleDeleteState,
    handleAddDistrict,
    handleEditDistrict,
    handleDeleteDistrict,
    handleAddSyllabus,
    handleDeleteSyllabus,
    handleCountryFilter,
    handleStateFilter,
  } = useLocationManager();

  return (
    <>
      <StatsCards
        totalCountries={countries.length}
        totalStates={states.length}
        totalDistricts={districts.length}
        totalSyllabi={syllabi.length}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <CountryTable
          countries={countries}
          onAddCountry={handleAddCountry}
          onEditCountry={handleEditCountry}
          onDeleteCountry={handleDeleteCountry}
          isLoading={isLoadingCountries}
        />
        <StateTable
          states={states}
          countries={countries}
          selectedCountry={selectedCountry}
          onCountryFilter={handleCountryFilter}
          onAddState={handleAddState}
          onEditState={handleEditState}
          onDeleteState={handleDeleteState}
          isLoading={isLoadingStates}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <DistrictTable
          districts={districts}
          countries={countries}
          states={states}
          selectedCountry={selectedCountry}
          selectedState={selectedState}
          onCountryFilter={handleCountryFilter}
          onStateFilter={handleStateFilter}
          onAddDistrict={handleAddDistrict}
          onEditDistrict={handleEditDistrict}
          onDeleteDistrict={handleDeleteDistrict}
          isLoading={isLoadingDistricts}
        />
        <SyllabusTable
          syllabi={syllabi}
          onAddSyllabus={handleAddSyllabus}
          onDeleteSyllabus={handleDeleteSyllabus}
          isLoading={isLoadingSyllabi}
        />
      </div>
    </>
  );
}

export default LocationManager;
