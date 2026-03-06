const cardBase =
  "rounded-xl border flex items-center gap-2.5 p-3 flex-shrink-0 min-w-[132px] lg:min-w-0 shadow-sm transition-shadow hover:shadow-md";

const StatsCards = ({
  totalCountries,
  totalStates,
  totalDistricts,
  totalSyllabi,
}) => {
  const cards = [
    {
      label: "Countries",
      value: totalCountries,
      icon: "fa-globe",
      style:
        "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 text-blue-900",
      iconBg: "bg-blue-500",
    },
    {
      label: "States",
      value: totalStates,
      icon: "fa-map-marker-alt",
      style:
        "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 text-green-900",
      iconBg: "bg-green-500",
    },
    {
      label: "Districts",
      value: totalDistricts,
      icon: "fa-map-pin",
      style:
        "bg-gradient-to-r from-purple-50 to-violet-50 border-purple-200 text-purple-900",
      iconBg: "bg-purple-500",
    },
    {
      label: "Syllabi",
      value: totalSyllabi,
      icon: "fa-book",
      style:
        "bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 text-amber-900",
      iconBg: "bg-amber-500",
    },
  ];

  return (
    <div className="flex overflow-x-auto gap-3 pb-2 -mx-1 px-1 snap-x snap-mandatory lg:grid lg:grid-cols-4 lg:overflow-visible lg:gap-4 lg:mx-0 lg:px-0">
      {cards.map(({ label, value, icon, style, iconBg }) => (
        <div
          key={label}
          className={`${cardBase} ${style} snap-center`}
        >
          <div
            className={`w-9 h-9 shrink-0 rounded-lg ${iconBg} flex items-center justify-center text-white`}
          >
            <i className={`fas ${icon} text-xs`} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold opacity-90 uppercase tracking-wider truncate">
              {label}
            </p>
            <p className="text-xl lg:text-2xl font-bold tabular-nums leading-tight">
              {value}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;