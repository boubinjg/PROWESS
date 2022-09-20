import { useForm } from "react-cool-form";

interface FormInfo{
    children: formChildren;
}

export const FormData: FunctionComponent<FormInfo> = ({
  children,
}) => {

    const Field = ({ label, id, error, ...rest }) => (
        <div>
            <label htmlFor={id}>{label}</label>
            <input id={id} {...rest} />
            {error && <p>{error}</p>}
        </div>
    );

    const { form, select } = useForm({
    // (Strongly advise) Provide the default values just like we use React state
    defaultValues: { username: "", email: "", password: "" },
    // The event only triggered when the form is valid
    onSubmit: (values) => console.log("onSubmit: ", values),
    });
  // We can enable the "errorWithTouched" option to filter the error of an un-blurred field
  // Which helps the user focus on typing without being annoyed by the error message

    const errors = select("errors", { errorWithTouched: true }); // Default is "false"

    return children(form, select, errors, Field);
};
