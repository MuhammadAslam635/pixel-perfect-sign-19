const StatsCard = () => {
  return (
    <section className="stats-card relative w-full overflow-hidden rounded-[36px] border border-white/10 px-6 py-6 sm:px-8 sm:py-8">
      <div className="relative z-10 flex h-full flex-col sm:flex-row sm:items-start gap-6">
        {/* Left Section - Text Metrics - Takes half width on desktop */}
        <div className="flex flex-col gap-3 sm:gap-4 sm:w-1/2">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="text-[#7A7A7A] text-sm sm:text-base font-medium">
              Total Campaings
            </span>
            <span
              className="rounded-full bg-[#FFFFFF1A] px-3 py-1 text-xs font-medium text-white"
              style={{
                boxShadow:
                  "0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset",
              }}
            >
              +3.4%
            </span>
          </div>
          <p className="text-[15px] sm:text-4xl md:text-5xl font-normal tracking-tight text-white mt-2 sm:mt-6 md:mt-32">
            220,342.76
          </p>
        </div>

        {/* Right Section - Chart - Takes half width on desktop */}
        <div className="relative sm:w-1/2 h-full hidden sm:block">
          <div className="absolute inset-0 flex items-center justify-center pt-8 sm:pt-12 md:pt-16">
            <svg
              width="359"
              height="161"
              viewBox="0 0 359 161"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full mt-28"
            >
              <path
                d="M-3.87411 47.9192L-14.125 58.6362C-21.4518 66.2963 -32.7449 68.642 -42.5163 64.5335C-59.3702 57.447 -78 69.8235 -78 88.1066V118.461C-78 143.721 -57.5225 164.199 -32.2623 164.199L313.757 164.199C340.819 164.199 362.757 142.261 362.757 115.199V14.8388C362.757 11.4568 360.433 8.51791 357.142 7.73821C354.538 7.12134 351.806 7.979 350.022 9.97311L328.08 34.4965C324.79 38.1737 319.932 40.0452 315.026 39.5265C311.382 39.1413 307.72 40.0722 304.702 42.1511L268.858 66.8457C267.143 68.0275 265.109 68.6603 263.026 68.6603C260.527 68.6603 258.113 67.7495 256.236 66.0983L226.368 39.8197C223.292 37.1129 218.984 36.3004 215.132 37.7008C210.745 39.2962 205.828 38.0056 202.79 34.4611L190.493 20.1143C187.994 17.1988 184.498 15.3194 180.688 14.8432C175.547 14.2006 170.427 16.1795 167.055 20.1122L154.148 35.1654C153.357 36.0876 152.092 36.448 150.933 36.0809C149.703 35.691 148.361 36.1233 147.59 37.1579L131.298 59.0157L110.365 81.3136C109.098 82.6637 107.328 83.4295 105.476 83.4295C104.11 83.4295 102.777 83.0124 101.655 82.234L97.757 79.5306C93.9513 76.8912 91.082 73.1116 89.5623 68.7366L68.1952 7.22019C67.3589 4.81242 65.5193 2.8858 63.1527 1.93917C60.7583 0.981388 58.0641 1.12262 55.7829 2.32551L52.6947 3.95397C49.6432 5.56301 47.1789 8.09589 45.6541 11.1903L31.7685 39.37C31.2598 40.4022 30.5802 41.341 29.7584 42.1465C26.8057 45.0406 22.3982 45.8665 18.598 44.2379L15.7996 43.0385C12.6204 41.676 9.06345 41.4742 5.75059 42.4685L4.32661 42.8958C1.20457 43.8328 -1.62102 45.5636 -3.87411 47.9192Z"
                fill="url(#paint0_linear_10_1037)"
                fillOpacity="0.7"
              />
              <path
                d="M-81.3785 49.7056L-44.7982 65.1327C-34.9619 69.2809 -23.6527 65.3604 -16.6759 57.2805C-7.73074 46.9211 5.2112 36.5539 16.2927 45.634C35.4561 61.3364 36.5733 -2.65929 58.9466 2.01725C70.0737 4.34307 72.4181 34.1451 82.4372 59.0103C87.5616 71.728 90.7011 80.1268 95.2604 84.494C99.9859 89.0205 107.044 85.0715 111.066 79.9106L144.146 37.4728C144.91 36.4931 146.291 36.25 147.343 36.91C148.397 37.571 149.781 37.326 150.543 36.3431L159.981 24.1824C168.426 13.3018 185.196 14.4153 192.128 26.3169L197.107 34.8667C200.07 39.9539 206.457 41.8929 211.748 39.3118C216.108 37.1849 221.34 38.0954 224.726 41.5699L246.077 63.4824C253.842 71.4517 266.442 72.074 274.955 64.9086L301.939 42.1945C304.932 39.6752 309.102 39.0907 312.673 40.6901C316.885 42.5774 321.841 41.3986 324.752 37.8165L346.015 11.6579C349.315 7.5976 355.261 6.93083 359.378 10.1592"
                stroke="url(#paint1_linear_10_1037)"
                strokeOpacity="0.6"
                strokeWidth="3.53846"
              />
              <defs>
                <linearGradient
                  id="paint0_linear_10_1037"
                  x1="-220.598"
                  y1="14.9091"
                  x2="-214.029"
                  y2="178.473"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#385AB4" stopOpacity="0.4" />
                  <stop
                    offset="0.368352"
                    stopColor="#68B1B8"
                    stopOpacity="0.01"
                  />
                  <stop
                    offset="0.574372"
                    stopColor="#68B1B8"
                    stopOpacity="0.01"
                  />
                  <stop offset="1" stopColor="#68B1B8" stopOpacity="0.4" />
                </linearGradient>
                <linearGradient
                  id="paint1_linear_10_1037"
                  x1="-81.3785"
                  y1="44.762"
                  x2="359.378"
                  y2="44.762"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#68B3B7" />
                  <stop offset="1" stopColor="#3E65B4" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Vertical Progress Bar */}
          <div
            className="absolute left-24 top-56 bottom-0 flex items-center bg-red-500 "
            style={{
              background:
                "linear-gradient(180deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0) 69.33%)",
            }}
          >
            <svg
              width="24"
              height="149"
              viewBox="0 0 24 149"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                width="24"
                height="148.942"
                rx="12"
                fill="url(#paint0_linear_10_1040)"
                fillOpacity="0.1"
              />
              <path
                opacity="0.2"
                d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                fill="white"
              />
              <path
                d="M12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16Z"
                fill="url(#paint1_linear_10_1040)"
              />
              <path
                d="M12 15L12 146.942"
                stroke="url(#paint2_linear_10_1040)"
                strokeWidth="0.5"
                strokeDasharray="4 4"
              />
              <defs>
                <linearGradient
                  id="paint0_linear_10_1040"
                  x1="12"
                  y1="0"
                  x2="12"
                  y2="148.942"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="white" />
                  <stop offset="0.69326" stopColor="white" stopOpacity="0" />
                </linearGradient>
                <linearGradient
                  id="paint1_linear_10_1040"
                  x1="12"
                  y1="8"
                  x2="12"
                  y2="16"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#67B2B7" />
                  <stop offset="1" stopColor="#385AB4" />
                </linearGradient>
                <linearGradient
                  id="paint2_linear_10_1040"
                  x1="12.5007"
                  y1="15"
                  x2="12.5007"
                  y2="146.942"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="white" />
                  <stop offset="0.559801" stopColor="white" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Tooltip */}
          <div className="absolute right-16 top-2 rounded-lg bg-[#212121] px-4 py-2 text-center text-white shadow-lg">
            <span className="block text-xs text-[#7A7A7A] font-medium mb-0.5">
              Campaings
            </span>
            <span className="block text-base font-normal">200</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StatsCard;
