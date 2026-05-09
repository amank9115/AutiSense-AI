import time
from typing import Optional, Tuple

import cv2


class CameraStream:
    """Webcam frame reader for real-time inference."""

    def __init__(self, camera_index: int = 0) -> None:
        self.camera_index = camera_index
        self.cap = cv2.VideoCapture(self.camera_index)
        if not self.cap.isOpened():
            raise RuntimeError("Unable to open webcam. Check camera permissions and index.")

    def read_frame(self) -> Tuple[Optional[any], Optional[any]]:
        ok, frame_bgr = self.cap.read()
        if not ok:
            return None, None
        frame_rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
        return frame_bgr, frame_rgb

    def frame_generator(self, interval_sec: float = 0.0):
        while True:
            frame_bgr, frame_rgb = self.read_frame()
            if frame_bgr is None:
                continue
            yield frame_bgr, frame_rgb
            if interval_sec > 0:
                time.sleep(interval_sec)

    def release(self) -> None:
        if self.cap:
            self.cap.release()
