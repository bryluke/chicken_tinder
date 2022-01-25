const SessionPage = () => {
  const [sessionState, setSessionState] = useState(false);

  // On load, make a get request to see if there are
  useEffect(() => {
    axios.get('/user/session')
      .then((res) => {
        console.log(res);
        if (!res) return console.log('no current session');
        setSessionState(true);
      })
      .catch((err) => console.log(err));
  }, []);

  const createNewSession = () => {
    axios.post('/user/session/new', { userId: 1, matchId: 2, parameters: 'pseudo-data' });
  };

  return (

    <div className="session-page">
      <div className="session-display">
        {sessionState
          ? (
            <p>
              SOMEONE... has invited you to join a session...
              <br />
              Join Session now!
            </p>
          )
          : <p>You have no existing sessions open, create a new session!</p>}
      </div>
      <div className="session-buttons">
        {sessionState ? <button>Join Session</button> : <button disabled>Join Session</button>}
        <button onClick={createNewSession}>Create Session</button>
      </div>
    </div>
  );
};

export default SessionPage;