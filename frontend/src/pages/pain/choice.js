import React from "react";
import { useNavigate } from "react-router-dom";

function Choice() {
    const navigate=useNavigate();
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <div class="card1" style={{ margin: "2rem" }}>
          <div class="card" style={{ width: "25rem", height: "40rem" }}>
            <img
              src="https://images.thequint.com/thequint%2F2022-07%2Fe2305be9-e9da-491e-9955-cebaba47b7f2%2Fwarrior_pose_from_yoga_picture_id498058082.jpg"
              class="card-img-top"
              alt="..."
            />
            <div class="card-body">
              <h5 class="card-title">Session</h5>
              <p class="card-text">
                Explore our preset yoga exercise sessions to jump right into
                your yoga practice. If you believe in the transformative power
                of yoga for mental and spiritual well-being, start your journey
                by clicking here.
              </p>
              <button class="btn btn-primary" style={{ color: "black" }}>
                Go somewhere
              </button>
            </div>
          </div>
        </div>

        <div class="card2" style={{ margin: "2rem" }}>
          <div class="card" style={{ width: " 25rem", height: "40rem" }}>
            <img
              src="https://images.onlymyhealth.com/imported/images/2021/April/15_Apr_2021/ospteopenia_Large.jpg"
              class="card-img-top"
              alt="..."
            />
            <div class="card-body">
              <h5 class="card-title">Pain</h5>
              <p class="card-text">
                Are you grappling with discomfort and seeking relief? Embrace
                the healing power of yoga poses to alleviate pain,then click
                here !
              </p>
              <button
                class="btn btn-primary"
                style={{ color: "black" }}
                onClick={() => {
                  navigate("/pain");
                }}
              >
                Go somewhere
              </button>
            </div>
          </div>
        </div>

        {/* col3 */}
        <div class="card2" style={{ margin: "2rem" }}>
          <div class="card" style={{ width: " 25rem", height: "40rem" }}>
            <img
              src="https://static.vecteezy.com/system/resources/previews/008/251/857/original/woman-in-yoga-poses-illustration-in-cartoon-style-vector.jpg"
              class="card-img-top"
              alt="..."
            />
            <div class="card-body">
              <h5 class="card-title">Pose Mastery</h5>
              <p class="card-text">
                Unlock the path to mastery! . Practice any pose of your liking
                and conquer those challenging ones. Your journey to strength,
                flexibility, and well-being starts here!
              </p>
              <button
                class="btn btn-primary"
                style={{ color: "black" }}
                onClick={() => {
                  navigate("/start");
                }}
              >
                Go somewhere
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Choice;
