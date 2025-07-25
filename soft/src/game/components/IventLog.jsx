import React from "react";

export default function NPCStatus({ favor }) {
  return (
    <div className="npc-status">
      <h2>NPC好感度</h2>
      <div className="bar-container">
        <div
          className="bar"
          style={{ width: `${(favor / 128) * 100}%` }}
        ></div>
      </div>
      <p>{favor} / 128</p>
    </div>
  );
}
