<style scoped>
.forecast-details-card {
  margin-top: 16px;
}

.bold-text {
  font-weight: bold;
}

.forecast-name-bold {
  font-weight: bold;
}

.warning-icon {
  color: orange;
  margin-left: 4px;
}

.manual-adjustment-input-field {
  width: 150px; /* Or any other width you find suitable */
}

/* Ensure the date picker input text is always visible */
.standalone-date-input :deep(input.el-input__inner) {
  color: #303133 !important; /* Element Plus default text color - dark gray */
  background-color: #ffffff !important; /* White background */
  -webkit-text-fill-color: #303133 !important; /* Ensure text color for WebKit browsers */
  border: 1px solid #dcdfe6 !important; /* Default Element Plus border color */
}

/* Styling for the placeholder text */
.standalone-date-input :deep(input.el-input__inner::placeholder) {
  color: #a8abb2 !important; /* Element Plus placeholder color - light gray */
  -webkit-text-fill-color: #a8abb2 !important;
}

/* Styling for the date picker when it's disabled */
.standalone-date-input.is-disabled :deep(input.el-input__inner) {
  color: #c0c4cc !important; /* Element Plus disabled text color */
  background-color: #f5f7fa !important; /* Element Plus disabled background color */
  -webkit-text-fill-color: #c0c4cc !important;
}

/* Ensure icons are visible and have standard Element Plus color */
.standalone-date-input :deep(.el-input__prefix .el-input__icon),
.standalone-date-input :deep(.el-input__suffix .el-input__icon) {
  color: #c0c4cc !important; /* Element Plus icon color */
}

/* Override focus style if necessary, though Element Plus usually handles this well */
.standalone-date-input :deep(input.el-input__inner:focus) {
  border-color: #409eff !important; /* Element Plus focus border color */
}

</style> 