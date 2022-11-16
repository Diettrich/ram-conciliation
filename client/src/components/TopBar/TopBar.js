import * as React from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";

function TopBar() {
    return (
        <Box sx={{ flexGrow: 1 }}>
            <AppBar position="static">
                <Toolbar>
                    <Box sx={{ flexBasis: "33.33%", py: 2 }}>
                        <Box
                            sx={{
                                width: 120,
                            }}
                        >
                            <img
                                src="images/Logo_Royal_Air_Maroc.svg"
                                alt="logo"
                            />
                        </Box>
                    </Box>
                    <Box sx={{ flexBasis: "33.33%", textAlign: "center" }}>
                        <Typography
                            variant="h6"
                            component="div"
                            sx={{ flexGrow: 1 }}
                        >
                            Processus de réconciliation
                        </Typography>
                    </Box>
                    {/* <Button color="inherit">Login</Button> */}
                </Toolbar>
            </AppBar>
        </Box>
    );
}

export default TopBar;
