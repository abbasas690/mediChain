const Home = () => {
  return (
    <div className="home">
      <div
        className="slideInLeft"
        style={{
          display: "flex",
          justifyContent: "center",
          alignContent: "center",
          flexDirection: "column",
          height: "100vh",
          width: "80vw",
          margin: "0 auto",
          color: "white",
          // backgroundColor: "blueviolet",
        }}
      >
        <h1
          style={{
            width: "100%",
            fontSize: "5rem",
          }}
        >
          <span style={{ color: "blueviolet" }}>P</span>atient
        </h1>
        <h1
          style={{
            width: "100%",
            fontSize: "5rem",
          }}
        >
          {" "}
          Data{" "}
        </h1>
        <h1 style={{ width: "100%", fontSize: "5rem" }}>Management</h1>
      </div>
    </div>
  );
};

export default Home;
