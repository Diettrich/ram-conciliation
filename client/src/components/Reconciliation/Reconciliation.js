import React, { useRef, useState } from "react";
import axios from "axios";
import {
    Button,
    Container,
    FormControl,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { DateRangePicker } from "rsuite";

import TopBar from "../TopBar";
import { Box } from "@mui/system";

function Reconciliation() {
    const [filter, setFilter] = useState({
        canal: "",
        type: "",
        dateDebut: undefined,
        dateFin: undefined,
    });

    const [uploadMessage, setUploadMessage] = useState("");
    const [reconciliationData, setReconciliationData] = useState([]);
    const inputFile = useRef(null);

    const handleChange = (event) => {
        setFilter({
            ...filter,
            [event.target.name]: event.target.value,
        });
    };

    const handleCalendarChange = (value) => {
        setFilter({
            ...filter,
            dateDebut: value[0],
            dateFin: value[1],
        });
    };

    const handleFileInput = () => {
        inputFile.current.click();
    };

    const handleGetReconciliation = () => {
        axios
            .get("http://localhost:4000/api/reconciliation")
            .then((res) => {
                console.log(res);
                setReconciliationData(res.data.result);
            })
            .catch((err) => {
                console.log(err);
            });
    };

    const handleChangeFile = (e) => {
        const file = e.target.files[0];
        const formData = new FormData();

        formData.append("file", file);

        axios
            .post("http://localhost:4000/api/upload", formData)
            .then((res) => {
                setUploadMessage(res.data.message);
            })
            .then(() => {
                e.target.value = null;
            })
            .catch((error) => {
                console.log(error);
            });
    };

    return (
        <>
            <TopBar />
            <Container fixed>
                <Box sx={{ display: "flex", my: 8, gap: 8 }}>
                    <Box sx={{ flexBasis: "300px" }}>
                        <Box>
                            <Button
                                variant="outlined"
                                startIcon={<UploadFileIcon />}
                                onClick={handleFileInput}
                            >
                                Importer les fichiers
                            </Button>
                            <div>{uploadMessage}</div>
                            <input
                                type="file"
                                accept=".csv"
                                onChange={handleChangeFile}
                                ref={inputFile}
                                hidden
                            />
                        </Box>

                        <Box sx={{ minWidth: 120, mt: 6 }}>
                            <FormControl fullWidth>
                                <InputLabel id="canal-select-label">
                                    Canal
                                </InputLabel>
                                <Select
                                    labelId="canal-select-label"
                                    id="canal-select"
                                    name="canal"
                                    value={filter.canal}
                                    label="Canal"
                                    onChange={handleChange}
                                >
                                    <MenuItem value="Ventes">Ventes</MenuItem>
                                    <MenuItem value="Remboursement">
                                        Remboursement
                                    </MenuItem>
                                </Select>
                            </FormControl>
                        </Box>

                        <Box sx={{ minWidth: 120, mt: 6 }}>
                            <FormControl fullWidth>
                                <InputLabel id="type-select-label">
                                    Type de Réconciliation
                                </InputLabel>
                                <Select
                                    labelId="type-select-label"
                                    id="type-select"
                                    name="type"
                                    value={filter.type}
                                    label="Type de Réconciliation"
                                    onChange={handleChange}
                                >
                                    <MenuItem value="CMI">CMI</MenuItem>
                                    <MenuItem value="OGONE">OGONE</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>

                        <Box sx={{ mt: 6 }}>
                            <InputLabel id="type-select-label">
                                Date de Réconciliation:
                            </InputLabel>
                            <DateRangePicker onChange={handleCalendarChange} />
                        </Box>
                        <Box sx={{ mt: 6 }}>
                            <Button
                                variant="outlined"
                                onClick={handleGetReconciliation}
                            >
                                Réconciliation
                            </Button>
                        </Box>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <TableContainer component={Paper}>
                            <Table
                                sx={{ minWidth: 650 }}
                                aria-label="simple table"
                            >
                                <TableHead>
                                    <TableRow>
                                        <TableCell>issue_date</TableCell>
                                        <TableCell>PNR</TableCell>
                                        <TableCell>Entité</TableCell>
                                        <TableCell>AmountALTEA</TableCell>
                                        <TableCell>DeviceALTEA</TableCell>
                                        <TableCell>MtCanal</TableCell>
                                        <TableCell>DeviseCanal</TableCell>
                                        <TableCell>Ecart</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {reconciliationData.map((row) => (
                                        <TableRow
                                            key={row.issue_date}
                                            sx={{
                                                "&:last-child td, &:last-child th": {
                                                    border: 0,
                                                },
                                            }}
                                        >
                                            <TableCell>
                                                {row.issue_date}
                                            </TableCell>
                                            <TableCell>{row.PNR}</TableCell>
                                            <TableCell>{row.Entite} </TableCell>
                                            <TableCell>
                                                {row.AmountALTEA}
                                            </TableCell>
                                            <TableCell>
                                                {row.DeviceALTEA}
                                            </TableCell>
                                            <TableCell>{row.MtCanal}</TableCell>
                                            <TableCell>
                                                {row.DeviseCanal}
                                            </TableCell>
                                            <TableCell>{row.Ecart}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                </Box>
            </Container>
        </>
    );
}

export default Reconciliation;
