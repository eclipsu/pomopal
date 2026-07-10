import React from "react";

const Alarm = React.forwardRef(({ src = "/alarm.mp3" }, ref) => {
  return <audio ref={ref} src={src} preload="auto" />;
});

Alarm.displayName = "Alarm";

export default React.memo(Alarm);
