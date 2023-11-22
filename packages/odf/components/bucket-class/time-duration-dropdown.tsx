import * as React from 'react';
import StaticDropdown from '@odf/shared/dropdown/StaticDropdown';
import classNames from 'classnames';
import {
  InputGroup,
  TextInput,
  ValidatedOptions,
  InputGroupItem,
} from '@patternfly/react-core';
import { TimeUnits } from '../../constants';

export const TimeDurationDropdown: React.FC<TimeDurationDropdownProps> = ({
  id, // eslint-disable-line @typescript-eslint/no-unused-vars
  inputClassName,
  onChange,
  required,
  testID,
  placeholder,
  inputID,
}) => {
  const [unit, setUnit] = React.useState(TimeUnits.HOUR);
  const [value, setValue] = React.useState(0);
  const [validated, setValidated] = React.useState(ValidatedOptions.success);

  const onValueChange = (val) => {
    setValue(val);
    onChange({ value: val, unit }, setValidated);
  };

  const onUnitChange = (newUnit) => {
    setUnit(newUnit);
    onChange({ value, unit: newUnit }, setValidated);
  };

  return (
    <InputGroup translate={undefined}>
      <InputGroupItem isFill>
        <TextInput
          className={classNames('pf-c-form-control', inputClassName)}
          type="number"
          onChange={(_event, val) => onValueChange(val)}
          placeholder={placeholder}
          data-test={testID}
          value={value}
          id={inputID}
          validated={validated}
        />
      </InputGroupItem>
      <InputGroupItem>
        <StaticDropdown
          defaultSelection={TimeUnits.HOUR}
          dropdownItems={TimeUnits}
          onSelect={onUnitChange}
          required={required}
        />
      </InputGroupItem>
    </InputGroup>
  );
};

type TimeDurationDropdownProps = {
  id: string;
  placeholder?: string;
  inputClassName?: string;
  onChange: Function;
  required?: boolean;
  testID?: string;
  inputID?: string;
};
