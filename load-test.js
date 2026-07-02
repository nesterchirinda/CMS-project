// PURPOSE: Load test for GET /api/complaints using k6, validating NFR03 (2 second response time)

import http from 'k6/http';
import { check, sleep } from 'k6';


// 10  users for 10 seconds, simulating concurrent Agent traffic
export let options = {
  vus: 10,
  duration: '10s',
};

// runs once before the load test starts, not once per virtual user
// logs in as an Agent to obtain a JWT, since /api/complaints requires auth
export function setup() {
  const loginRes = http.post('http://localhost:3000/api/auth/login', JSON.stringify({
    email: 'l.fan@natwest.com',
    password: 'Password123!',
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  const token = loginRes.json('token');
  return { token };
}

// each virtual user repeats this function for the test duration
export default function (data) {
  const res = http.get('http://localhost:3000/api/complaints', {
    headers: {
      Authorization: `Bearer ${data.token}`,
    },
  });

    // validates NFR03 directly, response time must stay under 2000ms
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 2000ms': (r) => r.timings.duration < 2000,
  });

  sleep(1);
}