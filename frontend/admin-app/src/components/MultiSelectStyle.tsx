export const multiSelectDarkTheme = {
    control: (provided: any) => ({
        ...provided,
        backgroundColor: "#1e1e1e",
        borderColor: "#444",
        color: "#fff",
    }),
    menu: (provided: any) => ({
        ...provided,
        backgroundColor: "#1e1e1e",
    }),
    option: (provided: any, state: any) => ({
        ...provided,
        backgroundColor: state.isFocused ? "#333" : "#1e1e1e",
        color: "#fff",
        cursor: "pointer",
    }),
    multiValue: (provided: any) => ({
        ...provided,
        backgroundColor: "#333",
    }),
    multiValueLabel: (provided: any) => ({
        ...provided,
        color: "#fff",
    }),
    multiValueRemove: (provided: any) => ({
        ...provided,
        color: "#ccc",
        ":hover": {
            backgroundColor: "#555",
            color: "#fff",
        },
    }),
};