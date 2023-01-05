import axios from "axios";
import React, { Fragment, useState, useEffect } from "react";
import {
  Alert,
  Button,
  Card,
  CardBody,
  CardFooter,
  Input,
  Modal,
  ModalFooter,
  Progress,
  Spinner,
  Table,
} from "reactstrap";
import DotSpinner from "./DotSpinner";
import DragAndDrop from "./DragAndDrop";
import { baseUrl } from "../../@components/constants";
import { RiAddFill } from "react-icons/ri";
import Select from "react-select";

import { CustomOption } from "../../@components/data-manager";
import { forEveryKeyLoop } from "../../@components/loops";
import classNames from "classnames";

import { dateFunction } from "../../@components/date-management";
import { Check, CheckCircle, Info, XCircle } from "react-feather";
import toastify from "../../@components/toastify";
import Sidebar from "../../@components/sidebar";
import DragAndDropView from "./DragAndDropView";
export default function UploadFiles() {
  const [modal, setModal] = useState(false),
    [spinner, setSpinner] = useState(false),
    [completeSpinner, setCompleteSpinner] = useState(false),
    [added, setAdded] = useState(false),
    [progress, setProgress] = useState(false),
    [allFiles, setAllFiles] = useState([]),
    [author, setAuthor] = useState(""),
    [open, setOpen] = useState(false),
    [taskId, setTaskId] = useState(""),
    [taskIdBoolean, setTaskIdBoolean] = useState(false),
    [list, setList] = useState(""),
    [processList, setProcessList] = useState(""),
    [selectedFiles, setSelectedFiles] = useState([]);
  const allAuthors = allFiles.map((i) => i.author);
  const authors = [...new Set(allAuthors)].map((i) => ({ label: i }));
  useEffect(() => {
    setModal(true);
  }, []);
  const completedColor = (arg) => {
    if (arg >= 0 && arg <= 50) {
      return "warning";
    } else if (arg >= 51 && arg <= 80) {
      return "info";
    } else if (arg >= 81 && arg >= 100) {
      return "success";
    }
  };
  const uploadFileHandler = (file) => {
    setSpinner(true);
    setModal(true);
    let form_data = new FormData();
    form_data.append("file", file);
    axios
      .post(`${baseUrl}/documentchecker/`, form_data)
      .then((res) => {
        setAllFiles((c) => c.concat(res.data));
        setSelectedFiles((c) => c.concat(res.data.id));
        setAdded(true);
        setSpinner(false);
        setModal(false);
      })
      .catch((e) => {
        if (e.response && e.response.status === 400) {
          forEveryKeyLoop(e.response.data);
        }
        setAdded(true);

        setSpinner(false);
        setModal(false);
      });
  };
  // const checkIconHandler = () => {
  const checkHandler = () => {
    let files = [];
    if (list.year_info) {
      for (let i = 0; i < list.year_info.length; i++) {
        files.push(...list.year_info[i].file_ids);
      }
      // const checkList = list.year_info.map((i) => i.file_ids);
      return files;
    } else {
      return null;
    }
  };
  const checked = checkHandler();
  // };

  const selectFileHandler = (e, id) => {
    if (!e.target.checked) {
      setSelectedFiles(selectedFiles.filter((i) => i !== id));
      setProgress(false);
      setSpinner(false);
    } else {
      setSelectedFiles([...selectedFiles, id]);
      setProgress(false);
      setSpinner(false);
    }
  };
  const getThrushhold = (id) => {
    axios
      .get(`${baseUrl}/documentchecker/task/${id ? id : taskId}/`)
      .then((res) => {
        setList(res.data);
        getProgress(id);
      });
  };
  //**process button api */
  const processHandler = () => {
    if (!author) {
      toastify("error", Info, "Select Author");
    } else {
      const data = {
        file_id: selectedFiles,
        author,
      };
      axios
        .post(`${baseUrl}/documentchecker/document/`, data)
        .then((res) => {
          setProgress(true);
          setSpinner(true);
          setTaskId(res.data.task_id);
          setTaskIdBoolean(true);
          getThrushhold(res.data.task_id);
          // getProgress(res.data.task_id);
        })
        .catch((e) => {
          forEveryKeyLoop(e.response.data);
          setProgress(false);

          setSpinner(false);
        });
    }
  };
  //** */ Complete Bar data api
  const getProgress = (id) => {
    axios
      .get(`${baseUrl}/documentchecker/progress/${id ? id : taskId}/`)
      .then((res) => {
        setProcessList(res.data);
      });
  };
  const completPercentage = () => {
    const authFilterList = allFiles.filter((i) => i.author === author);
    const fileCount = authFilterList.length;
    const result = (processList.completed_file * 100) / processList.threshold;

    return {
      result: parseFloat(result ? result : 0).toFixed(2),
      fileCount,
    };
  };
  //**complete button api */
  const completeBtnHandler = (id) => {
    setCompleteSpinner(true);
    const data = {
      complete: true,
    };
    axios
      .patch(`${baseUrl}/documentchecker/complete/${id ? id : taskId}/`, data)
      .then((res) => {
        setCompleteSpinner(false);
        toastify("success", CheckCircle, "Successfully Completed");
      })
      .catch((res) => {
        setCompleteSpinner(false);
      });
  };

  // console.log("checksHandler", checksHandler);
  const completedFiles = completPercentage();
  useEffect(() => {
    if (progress && taskId && taskIdBoolean) {
      const interval = setInterval(() => {
        getProgress();
      }, 1000 * 5);
      return () => clearInterval(interval);
    }
  }, [taskIdBoolean]);
  useEffect(() => {
    if (processList.status !== "Complete" && taskId) {
      const interval = setInterval(() => {
        getThrushhold();
      }, 1000 * 5);
      return () => clearInterval(interval);
    }
  }, [processList.status]);

  return (
    <Fragment>
      <Sidebar isOpen={open} setIsOpen={setOpen} />
      <Modal isOpen={modal} centered toggle={() => setModal(false)}>
        <div className="upload-file-modal">
          {spinner ? (
            <DotSpinner />
          ) : (
            <DragAndDrop
              uploadFileHandler={uploadFileHandler}
              added={added}
              setModal={setModal}
            />
          )}
        </div>
        <ModalFooter>
          <Button color="primary" onClick={() => setModal(false)}>
            Cancel
          </Button>
        </ModalFooter>
      </Modal>
      {/* <DragAndDropView uploadFileHandler={uploadFileHandler}> */}
      <div className="container my-5" onMouseDown={() => console.log("mouse")}>
        {allFiles.length ? (
          <Fragment>
            <Card>
              <div className="d-flex justify-content-end me-2 mt-2">
                <div style={{ width: "230px" }}>
                  <Select
                    options={authors}
                    value={{ label: author ? author : "Select author" }}
                    onChange={(e) => {
                      setAuthor(e.label);
                      setProgress(false);
                      setSpinner(false);
                    }}
                    placeholder="Select Author"
                    components={{ Option: CustomOption }}

                    // theme={theme}
                  />
                </div>
              </div>
              <Table className="mb-0">
                <thead>
                  <tr>
                    <th></th>
                    <th></th>
                    <th>File</th>
                    <th>Author</th>
                    <th>Created at</th>
                    {/* <th></th> */}
                  </tr>
                </thead>
                <tbody>
                  {allFiles.map((item, index) => (
                    <tr
                      key={index}
                      className={classNames({
                        "bg-gray-nt": author && item.author !== author,
                      })}
                    >
                      <td>
                        <Input
                          disabled={author && item.author !== author}
                          onChange={(e) => selectFileHandler(e, item.id)}
                          type="checkbox"
                          checked={selectedFiles.includes(item.id)}
                          id={item.id}
                        />
                      </td>
                      <td>
                        {item.author === author && checked && (
                          <span>
                            {checked.includes(item.id) ? (
                              <CheckCircle className="text-success" size={15} />
                            ) : (
                              <XCircle className="text-danger" size={15} />
                            )}
                          </span>
                        )}
                      </td>
                      <td>
                        <img
                          src={require("../../@core/images/word.png")}
                          style={{
                            height: "20px",
                            objectFit: "contain",
                          }}
                          alt=""
                        />
                        {item.file_name ? item.file_name.split("/")[1] : ""}
                      </td>
                      <td>{item.author ? item.author : "---"}</td>
                      <td>{dateFunction(item.created_at)}</td>
                      {/* <td
                        onClick={() => setOpen(!open)}
                        className="cursor-pointer text-nowrap edit-class"
                      >
                        {" "}
                        <small>View</small>
                      </td> */}
                    </tr>
                  ))}
                </tbody>
              </Table>
              <CardFooter>
                <div className="d-flex justify-content-between">
                  <div>
                    <Button
                      color="primary"
                      onClick={() => {
                        setModal(true);
                        setProgress(false);
                        setSpinner(false);
                      }}
                    >
                      <RiAddFill /> Add more files
                    </Button>
                    <Button
                      disabled={progress === true}
                      color="primary"
                      onClick={() => processHandler()}
                    >
                      Process {spinner && <Spinner size="sm" />}
                    </Button>
                  </div>
                </div>
              </CardFooter>
              {list && (
                <Fragment>
                  <div className="text-center">
                    Progress {spinner && <Spinner color="primary" size="sm" />}
                  </div>
                  <Progress
                    className="m-2"
                    animated
                    striped
                    color={completedColor(
                      processList.progress ? processList.progress : 0
                    )}
                    value={processList.progress ? processList.progress : 0}
                  >
                    {processList.progress
                      ? parseFloat(processList.progress).toFixed(2)
                      : 0}
                    %
                  </Progress>
                  <Table className="mb-0">
                    <thead>
                      <tr>
                        <th>Year</th>
                        <th>Files</th>
                        <th>Word count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.year_info &&
                        list.year_info.map((item, index) => (
                          <tr key={index}>
                            <td>{item ? item.year : "---"}</td>
                            <td>{item ? item.file_count : "---"}</td>
                            <td>{item ? item.word_count : "---"}</td>
                          </tr>
                        ))}
                    </tbody>
                  </Table>
                  <br />
                  <div className="text-center mt-2">
                    Files Completed{" "}
                    <small>
                      ({processList.completed_file}/{processList.threshold})
                    </small>
                  </div>
                  <Progress
                    className="m-2"
                    animated
                    striped
                    color={completedColor(completedFiles.result)}
                    value={completedFiles.result}
                  >
                    {completedFiles.result}%
                  </Progress>
                  {processList.status === "Complete" && progress && (
                    <CardFooter>
                      <Button
                        color="primary"
                        disabled={completeSpinner}
                        onClick={() => {
                          completeBtnHandler();
                          setTaskIdBoolean(false);

                          setSpinner(false);
                        }}
                      >
                        Complete {completeSpinner && <Spinner size="sm" />}
                      </Button>
                    </CardFooter>
                  )}
                </Fragment>
              )}
            </Card>
          </Fragment>
        ) : (
          <Card>
            <CardBody>
              <Alert color="danger">No file</Alert>

              <Button
                color="primary"
                onClick={() => {
                  setModal(true);
                  setProgress(false);
                  setSpinner(false);
                }}
              >
                <RiAddFill /> Upload files
              </Button>
            </CardBody>
          </Card>
        )}
        <br />
        <Fragment></Fragment>
      </div>
      {/* </DragAndDropView> */}
    </Fragment>
  );
}
