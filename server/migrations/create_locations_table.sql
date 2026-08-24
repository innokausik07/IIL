-- Run in phpMyAdmin → innovatiview_new → SQL tab
CREATE TABLE IF NOT EXISTS `locations` (
  `id`              INT           NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `location_name`   VARCHAR(255)  NOT NULL,
  `contact_person`  VARCHAR(255)  NOT NULL,
  `department`      VARCHAR(255)  DEFAULT NULL,
  `designation`     VARCHAR(255)  DEFAULT NULL,
  `contact_no`      VARCHAR(50)   NOT NULL,
  `contact_email`   VARCHAR(255)  NOT NULL,
  `pan`             VARCHAR(50)   DEFAULT NULL,
  `gstin`           VARCHAR(50)   DEFAULT NULL,
  `pincode`         VARCHAR(20)   NOT NULL,
  `city`            VARCHAR(100)  NOT NULL,
  `state`           VARCHAR(100)  NOT NULL,
  `address`         TEXT          NOT NULL,
  `status`          VARCHAR(5)    DEFAULT '1',
  `created_at`      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);
