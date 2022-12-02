import React, { useRef, useState, useCallback } from "react";
import axios from "axios";
import {
    Button,
    Checkbox,
    Container,
    FormControl,
    FormControlLabel,
    InputLabel,
    // MenuItem,
    Paper,
    // Select,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { DateRangePicker } from "rsuite";

import TopBar from "../TopBar";
import { Box } from "@mui/system";
// fields
{
    /* <TableCell>{row.PAYDATE}</TableCell>
<TableCell>{row.PNR}</TableCell>
<TableCell>{row.Entité} </TableCell>
<TableCell>
    {row.Amount_Canal}
</TableCell>
<TableCell>
    {row.Devise_Canal}
</TableCell>
<TableCell>{row.Canal}</TableCell>
<TableCell>{row.Total}</TableCell>
<TableCell>{row.ecart}</TableCell>
<TableCell>{row.type}</TableCell> */
}

// header names
{
    /* <TableCell>date de paiement</TableCell>
<TableCell>PNR</TableCell>
<TableCell>Entité</TableCell>
<TableCell>Montant</TableCell>
<TableCell>Devise</TableCell>
<TableCell>Canal</TableCell>
<TableCell>Total</TableCell>
<TableCell>Ecart</TableCell>
<TableCell>type</TableCell> */
}

const columns = [
    { field: "PAYDATE", headerName: "date de paiement" },
    { field: "PNR", headerName: "PNR" },
    { field: "Entité", headerName: "Entité" },
    { field: "Amount_Canal", headerName: "Montant" },
    { field: "Devise_Canal", headerName: "Devise" },
    { field: "Canal", headerName: "Canal" },
    { field: "Total", headerName: "Total" },
    { field: "ecart", headerName: "Ecart" },
    { field: "type", headerName: "type" },
];

function Reconciliation() {
    const [filter, setFilter] = useState({
        canal: {
            Altea: false,
            APP: false,
            Binga: false,
            CMI: false,
            Fatourati: false,
            OGONE: false,
            Thunes: false,
        },
        type: {
            rembourcement: false,
            vente: false,
        },
        dateDebut: undefined,
        dateFin: undefined,
    });

    const [uploadMessage, setUploadMessage] = useState("");
    const [reconciliationData, setReconciliationData] = useState([]);
    const inputFile = useRef(null);

    const handleChange = useCallback(
        (event) => {
            if (event.target.name === "canal") {
                setFilter({
                    ...filter,
                    canal: {
                        ...filter.canal,
                        [event.target.value]: !filter.canal[event.target.value],
                    },
                });
            }
            if (event.target.name === "type") {
                setFilter({
                    ...filter,
                    type: {
                        ...filter.type,
                        [event.target.value]: !filter.type[event.target.value],
                    },
                });
            }
        },
        [filter]
    );

    const handleResetFilter = () => {
        setFilter({
            canal: {
                APP: false,
                OGONE: false,
                CMI: false,
                Altea: false,
                Binga: false,
                Fatourati: false,
            },
            type: "",
            dateDebut: undefined,
            dateFin: undefined,
        });
    };

    const handleCalendarChange = (value) => {
        setFilter({
            ...filter,
            dateDebut: value ? value[0] : undefined,
            dateFin: value ? value[1] : undefined,
        });
    };

    const handleFileInput = () => {
        inputFile.current.click();
    };

    const getExcelData = () => {
        axios
            .post("http://localhost:4000/api/reconciliation/export", filter, {
                responseType: "blob",
            })
            .then((response) => {
                console.log(response);
                const url = window.URL.createObjectURL(
                    new Blob([response.data])
                );
                const link = document.createElement("a");
                link.href = url;
                link.setAttribute("download", `${Date.now()}.xlsx`);
                document.body.appendChild(link);
                link.click();
            })
            .catch((error) => {
                console.log(error);
            });
    };

    const handleGetReconciliation = () => {
        console.log(filter);

        axios
            .post("http://localhost:4000/api/reconciliation", filter)
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
                                <Typography>Type de Réconciliation</Typography>
                                {/* <Select
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
                                </Select> */}
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={filter.type.rembourcement}
                                            onChange={handleChange}
                                            name="type"
                                            value="rembourcement"
                                        />
                                    }
                                    label="Remboursement"
                                />
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={filter.type.vente}
                                            onChange={handleChange}
                                            name="type"
                                            value="vente"
                                        />
                                    }
                                    label="Vente"
                                />
                            </FormControl>
                        </Box>

                        <Box sx={{ minWidth: 120, mt: 6 }}>
                            <FormControl fullWidth>
                                <Typography>Canal de Réconciliation</Typography>
                                {Object.keys(filter.canal).map((canal) => (
                                    <FormControlLabel
                                        key={canal}
                                        control={
                                            <Checkbox
                                                checked={filter.canal[canal]}
                                                onChange={handleChange}
                                                name="canal"
                                                value={canal}
                                            />
                                        }
                                        label={canal}
                                    />
                                ))}
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
                        <Box sx={{ mt: 6 }}>
                            <Button variant="outlined" onClick={getExcelData}>
                                export excel
                            </Button>
                        </Box>
                        <Box sx={{ mt: 6 }}>
                            <Button
                                variant="outlined"
                                onClick={handleResetFilter}
                            >
                                Réinitialiser les filtres
                            </Button>
                        </Box>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <div style={{ height: 631, width: "100%" }}>
                            <DataGrid
                                rows={reconciliationData}
                                columns={columns}
                                pageSize={10}
                                rowsPerPageOptions={[5]}
                            />
                        </div>
                        {/* <TableContainer component={Paper}>
                            <Table
                                sx={{ minWidth: 650 }}
                                aria-label="simple table"
                            >
                                <TableHead>
                                    <TableRow>
                                        <TableCell>date de paiement</TableCell>
                                        <TableCell>PNR</TableCell>
                                        <TableCell>Entité</TableCell>
                                        <TableCell>Montant</TableCell>
                                        <TableCell>Devise</TableCell>
                                        <TableCell>Canal</TableCell>
                                        <TableCell>Total</TableCell>
                                        <TableCell>Ecart</TableCell>
                                        <TableCell>type</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {reconciliationData.map((row, index) => (
                                        <TableRow
                                            key={index}
                                            sx={{
                                                "&:last-child td, &:last-child th":
                                                    {
                                                        border: 0,
                                                    },
                                            }}
                                        >
                                            <TableCell>{row.PAYDATE}</TableCell>
                                            <TableCell>{row.PNR}</TableCell>
                                            <TableCell>{row.Entité} </TableCell>
                                            <TableCell>
                                                {row.Amount_Canal}
                                            </TableCell>
                                            <TableCell>
                                                {row.Devise_Canal}
                                            </TableCell>
                                            <TableCell>{row.Canal}</TableCell>
                                            <TableCell>{row.Total}</TableCell>
                                            <TableCell>{row.ecart}</TableCell>
                                            <TableCell>{row.type}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer> */}
                    </Box>
                </Box>
            </Container>
        </>
    );
}

export default Reconciliation;
