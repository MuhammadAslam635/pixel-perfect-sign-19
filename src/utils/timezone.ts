const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

const pad = (value: number) => value.toString().padStart(2, "0");

const isValidTime = (time: string) => TIME_PATTERN.test(time);

export const convertLocalTimeToUTC = (time: string) => {
  if (!isValidTime(time)) {
    return time;
  }

  const [hours, minutes] = time.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);

  return `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`;
};

export const convertUTCToLocalTime = (utcTime: string) => {
  if (!isValidTime(utcTime)) {
    return utcTime;
  }

  const [hours, minutes] = utcTime.split(":").map(Number);
  const date = new Date();
  date.setUTCHours(hours, minutes, 0, 0);

  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
};


