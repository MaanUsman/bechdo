/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

window.ansabWebView = {};

(function($) {
  var rootDiv = '';
  var treeGround = null;
  var newMemberForm = '';
  var editMemberForm = '';
  var memberName = '';
  var memberGender = '';
  var memberAge = '';
  var memberPic = '';
  var memberRelation = '';
  var familyTree = new Array();
  var memberId = 0;
  var selectedMember = null; // refrence to selected member
  var self = true;
  var memberSpace = 92;
  var memberWidth = 115;
  var memberHeight = 107;
  var memberDetails = null;
  var options_menu = null;
  var object = new Object();
  var rut = null;
  var parent = null;
  var currentNode = null;
  var $editFormName;
  var $editFormGender;
  var $editFormAge;
  var $editFormRelation;
  var userSettingsDropdownTimeout;
  var searchFormTimeout;

  var $addMemberForm = "",
    $addMemberIcon = "",
    isMemberEdit = false,
    emailRegex = /^[A-Za-z0-9._-]*[A-Za-z0-9]+@[0-9]*[A-Za-z]+[0-9]*[A-Za-z]*\.[A-Za-z.]{2,10}$/,
    restrictedWidth = 100,
    searchQuery = "",
    newMember = "",
    existingMember = "",
    allFamilyMembers = "",
    $searchField = "",
    mainUser = "",
    treeLimitReached = false;
    seventhLevelNodeCount = 0,
    mobileNumberRegex = /^\+[1-9]{1}[0-9]{1,14}$/,
    maxTreeLevelReached = false;

  function cacheElements() {
    $editFormName = $("#pk-name-edit", ".pk-memberForm");
    $editFormAge = $("#pk-age-edit", ".pk-memberForm");
    $editFormGender = $("#pk-gender-edit", ".pk-memberForm");
    $editFormRelation = $("#pk-relation-edit", ".pk-memberForm");

    //$addMemberForm = $(".dropdown-add-member");
    $addMemberForm = $(".add-member-form-wrapper");
    $searchField = $(".search-view input");
    $searchResults = $(".search-results");

    eventHandlers();
  }

  function eventHandlers() {
    var $userSettingsDropdown = $(".tree-settings-dropdown"),
      $searchForm = $(".search-view");

    $( document ).ajaxStart(function() {
      $("body").addClass("loading");
    });

    $( document ).ajaxStop(function() {
      $("body").removeClass("loading");
    });

    $('input:radio[name="aliveStatus"]').change(
    function(){
      if ($(this).is(':checked') && $(this).val() == 'false') {
        disableMobileAndEmailField(true);
        $("#pk-mobile-no").removeClass("input-field-error");
        //$("#pk-mobile-no").val("");
        $("#pk-mobile-no").attr("placeholder", "Mobile No");

      } else {
        disableMobileAndEmailField(false);
      }
    });

    $("#userNavigator").on("click", function(event) {
      var $userNode = $(".node-class[data-ansabid="+mainUser.user_ID+"]");
      $(".node-class").removeClass("node-clicked");
      changeUserPicture();

      $(".node-class[data-ansabid="+mainUser.user_ID+"]").addClass("node-clicked");
      $(".node-class[data-ansabid="+mainUser.user_ID+"]").find(".member-image").attr("src", "images/icon-avt2.png");

      if ($userNode.parents("li").length === 7) {
        $userNode.find(".add-icon-wrapper").hide();
      }
      // animate to selected member

      var elOffset = $(".node-class[data-ansabid="+mainUser.user_ID+"]").offset().top;
      var elHeight = $(".node-class[data-ansabid="+mainUser.user_ID+"]").height();
      var windowHeight = $(window).height();
      var offset;

      if (elHeight < windowHeight) {
        offset = elOffset - ((windowHeight / 2) - (elHeight / 2));
      }
      else {
        offset = elOffset;
      }

      //
      var elOffsetLeft = $(".node-class[data-ansabid="+mainUser.user_ID+"]").offset().left;
      var elWidth = $(".node-class[data-ansabid="+mainUser.user_ID+"]").width();
      var windowWidth = $(window).width();
      var leftOffset;

      if (elWidth < windowWidth) {
        leftOffset = elOffsetLeft - ((windowWidth / 2) - (elWidth / 2));
      }
      else {
        leftOffset = elOffsetLeft;
      }
      //

      var speed = 700;
       $window = $(window),
        $nodeElement = $(".node-class[data-ansabid="+mainUser.user_ID+"]"),
        windowHeight = $("body").height(),
        windowWidth = $window.width(),
        windowScrollLeft = $window.scrollLeft(),
        windowScrollTop = $window.scrollTop(),
        elementOffset = $nodeElement.offset(),
        finalScrollLeft = elementOffset.left - windowWidth/2,
        finalScrollTop = elementOffset.top - windowHeight/4;

      $('html, body').animate({scrollTop:finalScrollTop, scrollLeft: finalScrollLeft}, speed);

      //$('html, body').animate({scrollTop:offset, scrollLeft: leftOffset}, speed);
    });

    $("#delete-yes").on("click", function(event) {
      $(".delete-prompt-wrapper").hide();
      removeMemberFromBackEnd($(currentNode).attr("data-ansabid"));

    });

    $("#delete-no").on("click", function(event) {
      $(".delete-prompt-wrapper").hide();
    });

    $(".tree-settings-button").on("click", function(event) {
      $userSettingsDropdown.show();
      $userSettingsDropdown.focus();
    });

    $(".option-wrapper:first").on("click", function(event) {
      $searchForm.show();
      $searchForm.focus();
    });

    $(".tree-settings-dropdown-button").on("click", function(event) {
      event.stopPropagation();
      console.log("is_ansab_tree");
      console.log($("input[name=tree-type]:checked").val());

      $.ajax({
        url: "http://52.33.194.176:8080/change-family-mode",
        type: "POST",
        data: {
          family_ID: mainUser.family_ID,
          is_ansab_tree: $("input[name=tree-type]:checked").val()
        },
        success: function(res) {
          console.log("tree type changed on backend");
          hideUserSettingsDropdown();
        },
        error: function(err) {
          console.log(err);
        }
      });
    });

    $(".cancel-button").on("click", closeAddMemberForm)

    $searchField.keyup(searchMembers);

    $(".search-view img").on("click", closeSearchView);

    $searchForm.on("mousedown", ".found-members-wrapper", function(event) {
      event.preventDefault();
      var $selected = $(this),
        ansab_id = $($selected).children("a").attr("data-ansabid")

      closeSearchView();
      changeUserPicture();

      $(".node-class").removeClass("node-clicked");
      $(".node-class[data-ansabid="+ansab_id+"]").addClass("node-clicked");
      $(".node-class[data-ansabid="+ansab_id+"]").find(".member-image").attr("src", "images/icon-avt2.png");

      // animate to selected member

      var elOffset = $(".node-class[data-ansabid="+ansab_id+"]").offset().top;
      var elHeight = $(".node-class[data-ansabid="+ansab_id+"]").height();
      var windowHeight = $(window).height();
      var offset;

      if (elHeight < windowHeight) {
        offset = elOffset - ((windowHeight / 2) - (elHeight / 2));
      }
      else {
        offset = elOffset;
      }

       // calculating horizontal scrolling
      var elOffsetLeft = $(".node-class[data-ansabid="+mainUser.user_ID+"]").offset().left;
      var elWidth = $(".node-class[data-ansabid="+mainUser.user_ID+"]").width();
      var windowWidth = $(window).width();
      var leftOffset;

      if (elWidth < windowWidth) {
        leftOffset = elOffsetLeft - ((windowWidth / 2) - (elWidth / 2));
      }
      else {
        leftOffset = elOffsetLeft;
      }
      //

      var speed = 400,
      $window = $(window),
        $nodeElement = $(".node-class[data-ansabid="+ansab_id+"]"),
        windowHeight = $("body").height(),
        windowWidth = $window.width(),
        windowScrollLeft = $window.scrollLeft(),
        windowScrollTop = $window.scrollTop(),
        elementOffset = $nodeElement.offset(),
        finalScrollLeft = elementOffset.left - windowWidth/2,
        finalScrollTop = elementOffset.top - windowHeight/4;

      $('html, body').animate({scrollTop:finalScrollTop, scrollLeft: finalScrollLeft}, speed);

    });

    function closeAddMemberForm() {
      $addMemberForm.hide();
      $(".node-class").removeClass("node-clicked");
      clearInputFieldsAndErrors();
      isMemberEdit = false;
      changeUserPicture();
    }

    function closeSearchView() {
      $searchForm.hide();
      $searchResults.empty();
      $searchField.val("");
    }

    function searchMembers() {
      searchQuery = $searchField.val();
      var memberQuery = "[data-name='" + searchQuery + "']";
      var $member = $(".node-class").filter(function() {
        if ($(this).attr("data-name").toLowerCase().indexOf(searchQuery.toLowerCase()) > -1) {
          return $(this);
        }
      });

      displaySearchResult($member);
    }

    function displaySearchResult(members) {
      var id,
        name = "";

      $searchResults.empty();

      for (var index = 0; index < members.length; index ++) {
        name = $(members[index]).attr("data-name");
        id = $(members[index]).attr("data-ansabid");

        var foundMember = $("<div class='found-members-wrapper'> <a data-name=" + name + " data-ansabid=" + id + ">" + name + "</a> </div>");
        $searchResults.append(foundMember[0]);  
      }
    }

    $userSettingsDropdown.on("focusin", onUserSettingsDropdownFocusin);
    $userSettingsDropdown.on("focusout", onUserSettingsDropdownFocusout);

    $searchForm.on("focusout", onsearchFormFocusout);
    $searchForm.on("focusin", onsearchFormFocusin);

    function hideUserSettingsDropdown() {
      $userSettingsDropdown.hide();
    }

    function hideSearchDropDown() {
      $searchForm.hide();
    }

    function onsearchFormFocusout() {
      if (searchFormTimeout) {
        clearTimeout(searchFormTimeout);
      }

      searchFormTimeout = setTimeout(function() {
        hideSearchDropDown();
      }, 100);
    }

    function onsearchFormFocusin() {
      if (searchFormTimeout) {
        clearTimeout(searchFormTimeout);
      }
    }

    function onUserSettingsDropdownFocusin() {
      if (userSettingsDropdownTimeout) {
        clearTimeout(userSettingsDropdownTimeout);
      }
    }

    function onUserSettingsDropdownFocusout() {
      if (userSettingsDropdownTimeout) {
        clearTimeout(userSettingsDropdownTimeout);
      }

      userSettingsDropdownTimeout = setTimeout(function() {
        hideUserSettingsDropdown();
      }, 100);
    }

    $("#searchTree").on("click", function(event) {
      event.stopImmediatePropagation();
      searchQuery = $(".search-dropdown input").val();
      var memberQuery = "[data-name='" + searchQuery + "']";
      //var $member = $(memberQuery)
      var $member = $(".node-class").filter(function() {
        if ($(this).attr("data-name").toLowerCase().indexOf(searchQuery.toLowerCase()) > -1) {
          return $(this);
        }
      })

      /*$('html, body').animate({
        scrollTop: $($member).offset().top,
        scrollLeft: $($member).offset().left
      });*/
      //$($member)[0].scrollToView();

      /*$member.addClass("node-clicked");
      $member.find(".member-image").attr("src", "http://52.33.194.176:8080//tree/images/icon-avt2.png");*/

    });

    /*$(document).on("click", function(event) {
      event.stopPropagation();
      console.log("doc clicked!");
      $(".dropdown-add-member").hide();
      $(".node-class").removeClass("node-clicked");
      clearInputFieldsAndErrors();
      isMemberEdit = false;
      changeUserPicture();
    })*/
  }

  function disableMobileAndEmailField(isDisabled) {
    if (isDisabled) {
      $("#pk-mobile-no").prop('disabled', true);
      $("#pk-email").prop('disabled', true);
      $(".mobile-format-example").hide();
    } else {
      $("#pk-mobile-no").prop('disabled', false);
      $("#pk-email").prop('disabled', false);
      $(".mobile-format-example").show();
    }
  }

  function clearInputFieldsAndErrors() {
    $('.add-member-form')[0].reset();
    disableMobileAndEmailField(false);
    $("#pk-name, #pk-mobile-no, #pk-email").removeClass("input-field-error");
    $(".form-error").hide();
    $("#pk-name").attr("placeholder", "Name");
    $("#pk-mobile-no").attr("placeholder", "Mobile No");
    $("#pk-email").attr("placeholder", "Email");

    $(".form-heading").text("Add Family Member");
  }

  function changeUserPicture() {
    $(".parent-node a img").attr("src", "images/icon-avt1.png");
  }

  $.fn.pk_family = function(options) {
    if (rootDiv == null) {
      // error message in console
      jQuery.error('wrong id given');
      return;
    }
    rootDiv = this;
  }

  function displayDeletePrompt() {
    $(".delete-prompt-wrapper").show();
  }

  // function to create tree from json data
  $.fn.pk_family_create = function(options) {
    console.log("inside create family");
    if (rootDiv == null) {
      // error message in console
      jQuery.error('wrong id given');
      return;
    }
    rootDiv = this;
    var settings = $.extend({
      // These are the defaults.
      data: "",
    }, options);
    var obj = settings.data;
    addBreadingGround();
    parent = $('<ul>');
    $(parent).appendTo(treeGround);
    createTree(obj);

    //checkRestrictedWidth();

    createNewMemberForm();
    member_details();
    document.oncontextmenu = function() {
      return false;
    };

  }

  function mapMemberAndContacts(memberId) {
    var properties = { };

    var user = _.find(allFamilyMembers, {user_ID: memberId});
    properties = {
      "name": user.username,
      "ansabid": user.user_ID,
      "family_ID": user.family_ID,
      "gender": user.gender,
      "alivestatus": user.is_alive,
      "mobilenumber": user.phone,
      "email": user.email
    };

    return properties;
  }

  function createNode(child, superParent) {
    var memberProperties = {};
      
    // setting attributes of parent
    var link = $('<a>');
    // mapping neo4j contacts with those of mysql
    memberProperties = mapMemberAndContacts(child.a0.properties.ansab_id);

    link.attr('data-ansabid', memberProperties.ansabid);
    link.attr('data-name', memberProperties.name);
    link.attr('data-gender', memberProperties.gender);
    link.attr('data-alivestatus', memberProperties.alivestatus);
    link.attr('data-mobilenumber', memberProperties.mobilenumber);
    link.attr('data-email', memberProperties.email);
    link.attr('data-relation', "Child");
    link.attr('data-familyid', memberProperties.family_ID);

    var center = $('<center>').appendTo(link);
    var pic = $('<img>').attr('src', "images/icon-avt1.png");
    $(pic).addClass("member-image");
    $(link).addClass("node-class");

    //adding crud operations icons for admin

    if (mainUser.userType_ID === 1) {
      $(link).append("<div class='delete-icon-wrapper'><i class='fa fa-times delete-member-icon' aria-hidden='true'></i></div>");
      $(link).append("<div class='edit-icon-wrapper'><i class='fa fa-pencil edit-member-icon' aria-hidden='true'></i></div>");
      $(link).append("<div class='add-icon-wrapper'><i class='fa fa-plus-circle add-member-icon' aria-hidden='true'></i></div>");
      
      if (superParent) {
        console.log("adding add parent fo super parent");
        $(link).append("<div class='add-parent-icon-wrapper'><i class='fa fa-plus-circle add-parent-icon' aria-hidden='true'></i></div>");
      }
    }

    $(pic).appendTo(center);
    $(center).append($('<br>'));

    var $childSpan = $('<span>');
    $childSpan.html(memberProperties.name).appendTo(center);
    $childSpan.addClass("member-name");

    onNodeWidthChange();
    checkRestrictedWidth();
    
    $(".tree-ground").on("click", ".node-class", function(event) {
      console.log("node clicked !!!!!!!!!!");

      var $target = $(event.target);
      event.stopImmediatePropagation();
      event.preventDefault();

      if ($target.closest('.dropdown-add-member').length) {
        return;
      }

      clearInputFieldsAndErrors();
      var $currentTarget = $(event.currentTarget);
      $(".node-class").removeClass("node-clicked");
      $(".node-class .dropdown-add-member").hide();
      changeUserPicture();

      $currentTarget.addClass("node-clicked");

      // if tree has reached seven levels for this node
      if ($currentTarget.parents("li").length === 7) {
        $currentTarget.find(".add-icon-wrapper").hide();
      }


      if (seventhLevelNodeCount > 0 || maxTreeLevelReached || $currentTarget.parents("li").length === 2) {
        $currentTarget.addClass("hide-parent-icon");
      } else {
        $currentTarget.removeClass("hide-parent-icon");
      }

      currentNode = $(this);
      selectedMember = this;
      $("img", currentNode).attr("src", "images/icon-avt2.png");

      $(".tree-ground").on("click", ".add-icon-wrapper", function(event) {
        memberRelation = "Child";
        event.stopPropagation();
        event.preventDefault();
        displayForm(currentNode);
      });

      $(".tree-ground").on("click", ".delete-icon-wrapper", function(event) {
        event.stopPropagation();
        event.preventDefault();
        //removeMember(currentNode);
        // prompt before deletion
        $(".delete-prompt-wrapper").show();
        //removeMemberFromBackEnd($(currentNode).attr("data-ansabid"));
      });

      $(".tree-ground").on("click", ".edit-icon-wrapper", function(event) {
        event.stopPropagation();
        event.preventDefault();
        isMemberEdit = true;
        displayForm(currentNode);

      });

      $(".tree-ground").on("click", ".add-parent-icon-wrapper", function(event) {
        event.stopPropagation();
        event.preventDefault();
        memberRelation = "Father";
        displayForm(currentNode);

      });

      if (event.button == 2) {
        return false;
      }

      return true;
    });

    return link;
  }

   function createTree(tree) {
    var memberProperties = {};

    if (tree.li0 != null) {
      // creating top level parent
      var li = $('<li>');
      $(li).appendTo(parent);
      $(li).addClass("parent-node");

      parent = li;

      var firstLevelChildInfo = createNode(tree.li0, true);
      $(firstLevelChildInfo).appendTo(parent);

      // if second level children exists
      if (tree.li0.ul != null) {
        var ul = $('<ul>');
        $(ul).appendTo(parent);

        for (var key in tree.li0.ul) {
          parent = ul;
          var li = $('<li>');
          $(li).appendTo(parent);
          $(li).addClass("parent-node");
          parent = li;

          var parentInfo = createNode(tree.li0.ul[key]);
           $(parentInfo).appendTo(parent);

          // if third level children exists 
          if (tree.li0.ul[key].ul != null) {
            var ul2 = $('<ul>');
            $(ul2).appendTo(parent);

            for (var thirdLevelChild in tree.li0.ul[key].ul) {
              parent = ul2;
              var li = $('<li>');
              $(li).appendTo(parent);
              $(li).addClass("parent-node");
              parent = li;
              var thirdLevelChildInfo = createNode(tree.li0.ul[key].ul[thirdLevelChild]);
              $(thirdLevelChildInfo).appendTo(parent);

              if (tree.li0.ul[key].ul[thirdLevelChild].ul != null) {
                var ul3 = $('<ul>');
                $(ul3).appendTo(parent);

                for (var fourthLevelChild in tree.li0.ul[key].ul[thirdLevelChild].ul) {
                  parent = ul3;
                  var li = $('<li>');
                  $(li).appendTo(parent);
                  $(li).addClass("parent-node");
                  parent = li;
                  
                  var fourthLevelChildInfo = createNode(tree.li0.ul[key].ul[thirdLevelChild].ul[fourthLevelChild]);
                  $(fourthLevelChildInfo).appendTo(parent);

                  // if fifth level children exists
                  if (tree.li0.ul[key].ul[thirdLevelChild].ul[fourthLevelChild].ul != null) {
                    var ul4 = $('<ul>');
                    $(ul4).appendTo(parent);
                    for (var fifthLevelChild in tree.li0.ul[key].ul[thirdLevelChild].ul[fourthLevelChild].ul) {
                      parent = ul4;
                      var li = $('<li>');
                      $(li).appendTo(parent);
                      $(li).addClass("parent-node");
                      parent = li;

                      var fifthLevelChildInfo = createNode(tree.li0.ul[key].ul[thirdLevelChild].ul[fourthLevelChild].ul[fifthLevelChild]);
                      $(fifthLevelChildInfo).appendTo(parent);

                      //if sixth level child exists
                      if (tree.li0.ul[key].ul[thirdLevelChild].ul[fourthLevelChild].ul[fifthLevelChild].ul != null) {
                        var ul5 = $("<ul>");
                        $(ul5).appendTo(parent);

                        for (var sixthLevelChild in tree.li0.ul[key].ul[thirdLevelChild].ul[fourthLevelChild].ul[fifthLevelChild].ul) {
                          parent = ul5;
                          var li = $("<li>");
                          $(li).appendTo(parent);
                          $(li).addClass("parent-node");
                          parent = li;

                          var sixthLevelChildInfo = createNode(tree.li0.ul[key].ul[thirdLevelChild].ul[fourthLevelChild].ul[fifthLevelChild].ul[sixthLevelChild]);
                          $(sixthLevelChildInfo).appendTo(parent);

                          // if seventh level child exixts
                          if (tree.li0.ul[key].ul[thirdLevelChild].ul[fourthLevelChild].ul[fifthLevelChild].ul[sixthLevelChild].ul != null) {
                            var ul6 = $("<ul>");
                            $(ul6).appendTo(parent);
                            //tree max limit of seven reached
                            treeLimitReached = true;

                            for (var seventhLevelChild in tree.li0.ul[key].ul[thirdLevelChild].ul[fourthLevelChild].ul[fifthLevelChild].ul[sixthLevelChild].ul) {
                              parent = ul6;
                              var li = $("<li>");
                              $(li).appendTo(parent);
                              $(li).addClass("parent-node");
                              parent = li;

                              var seventhLevelChildInfo = createNode(tree.li0.ul[key].ul[thirdLevelChild].ul[fourthLevelChild].ul[fifthLevelChild].ul[sixthLevelChild].ul[seventhLevelChild]);
                              $(seventhLevelChildInfo).appendTo(parent);
                            }  
                          }
                        }
                      }
                    }
                  }                  
                }
              } 
            }
          }
        }
      }
    }
    return;
  }

  function traverseObj(obj) {
    var memberProperties = {};
    for (var i in obj) {
      if (i.indexOf("li") > -1) {
        var li = $('<li>');
        $(li).appendTo(parent);
        //
        $(li).addClass("parent-node");
        //
        parent = li;
        traverseObj(obj[i]);
        parent = $(parent).parent();
      }
      if (i.indexOf("a") > -1 && i.length == 2) {
        var link = $('<a>');
        //console.log("beside mapping");
        //console.log(obj[i]);

        // mapping neo4j contacts with those of mysql
        memberProperties = mapMemberAndContacts(obj[i].properties.ansab_id);

        link.attr('data-ansabid', memberProperties.ansabid);
        link.attr('data-name', memberProperties.name);
        link.attr('data-gender', memberProperties.gender);
        link.attr('data-alivestatus', memberProperties.alivestatus);
        link.attr('data-mobilenumber', memberProperties.mobilenumber);
        link.attr('data-email', memberProperties.email);
        link.attr('data-relation', "Child");

        //link.attr('data-age', obj[i].age);


        if (obj[i].relation == 'Spouse') {
          link.attr('class', 'spouse');
        }
        var center = $('<center>').appendTo(link);
        var pic = $('<img>').attr('src', "images/icon-avt1.png");
        $(pic).addClass("member-image");
        $(link).addClass("node-class");

        //adding icons
        $(link).append("<i class='fa fa-times delete-member-icon' aria-hidden='true'></i>");
        $(link).append("<i class='fa fa-pencil edit-member-icon' aria-hidden='true'></i>");
        $(link).append("<i class='fa fa-plus-circle add-member-icon' aria-hidden='true'></i>");
        $(link).append("<i class='fa fa-plus-circle add-parent-icon' aria-hidden='true'></i>");

        //adding invisible div at the end which will contain add new member form
        $(link).append("<div class='dropdown-add-member'></div>");

        /*var extraData = "";
        if (obj[i].gender == "Male") {
          extraData = "(M)";
        } else {
          extraData = "(F)";
        }*/

        $(pic).appendTo(center);
        $(center).append($('<br>'));

        $('<span>').html(memberProperties.name).appendTo(center);
        $("span").addClass("member-name");

        $(".tree-ground").on("click", ".node-class", function(event) {
          var $target = $(event.target);
          event.stopImmediatePropagation();

          if ($target.closest('.dropdown-add-member').length) {
            return;
          }
          clearInputFieldsAndErrors();
          var $currentTarget = $(event.currentTarget);
          $(".node-class").removeClass("node-clicked");
          $(".node-class .dropdown-add-member").hide();
          changeUserPicture();

          $currentTarget.addClass("node-clicked");

          currentNode = $(this);
          selectedMember = this;
          $("img", currentNode).attr("src", "http://52.33.194.176:8080/tree/images/icon-avt2.png");

          // resolving problem of adding children of dynamically added child
          $(".tree-ground").on("click", ".add-member-icon", function(event) {
            memberRelation = "Child";
            event.stopPropagation();
            displayForm(currentNode);
          });

          $(".tree-ground").on("click", ".delete-member-icon", function(event) {
            event.stopPropagation();
            console.log("delete icon clicked");
            removeMember(currentNode);
          });

          $(".tree-ground").on("click", ".edit-member-icon", function(event) {
            event.stopPropagation();
            console.log("edit button clicked");
            isMemberEdit = true;
            displayForm(currentNode);

          });

          $(".tree-ground").on("click", ".add-parent-icon", function(event) {
            event.stopPropagation();
            memberRelation = "Father";
            console.log("add parent button clicked");
            displayForm(currentNode);

          });

          if (event.button == 2) {
            return false;
          }
          return true;
        });

        $(link).appendTo(parent);
      }

      if (i.indexOf("ul") > -1) {
        var ul = $('<ul>');
        $(ul).appendTo(parent);
        parent = ul;
        traverseObj(obj[i]);
        return;
      }
    }
    return;
  }

    // function traverseObj(obj) {
    //     for (var i in obj) {
    //         if (i.indexOf("li") > -1) {
    //             var li = $('<li>');
    //             $(li).appendTo(parent);
    //             parent = li;
    //             traverseObj(obj[i]);
    //     parent = $(parent).parent();
    //         }
    //         if (i.indexOf("a") > -1 && i.length == 2) {
    //             var link = $('<a>');
    //             link.attr('data-name', obj[i].name);
    //             link.attr('data-age', obj[i].age);
    //             link.attr('data-gender', obj[i].gender);
    //             link.attr('data-relation', obj[i].relation);
    //     // if(obj[i].relation == 'Spouse'){
    //     //   link.attr('class', 'spouse');
    //     // }
    //             var center = $('<center>').appendTo(link);
    //             var pic = $('<img>').attr('src', obj[i].pic);
    //             var extraData = "";
    //             // if (obj[i].gender == "Male") {
    //             //     extraData = "(M)";
    //             // } else {
    //             //     extraData = "(F)";
    //             // }
    //             $(pic).appendTo(center);
    //             $(center).append($('<br>'));
    //             $('<span>').html(obj[i].name + " " + extraData).appendTo(center);
    //             $(link).mousedown(function(event) {
    //                 if (event.button == 2) {
    //                     displayPopMenu(this, event);
    //                     return false;
    //                 }
    //                 return true;
    //             });
    //             $(link).appendTo(parent);
    //         }

    //         if (i.indexOf("ul") > -1) {
    //             var ul = $('<ul>');
    //             $(ul).appendTo(parent);
    //             parent = ul;
    //             traverseObj(obj[i]);
    //             return;
    //         }
    //     }
    //     return;
    // }

  // function to send data to server
  $.send_Family = $.fn.pk_family_send = function(options) {
    if (rootDiv == null) {
      // error message in console
      jQuery.error('wrong id given');
      return;
    }
    var settings = $.extend({
      // These are the defaults.
      url: "",
    }, options);
    var data = createSendURL();
    data = data.replace(new RegExp(']', 'g'), "");
    data = data.replace(new RegExp('\\[', 'g'), "");
    $.ajax({
      url: settings.url + "?tree=" + data,
    }).done(function() {
      alert('completed');
    });
  }

  function createSendURL() {
    rut = $(treeGround).find("ul:first");
    parent = object;
    object = createJson(rut);
    return (JSON.stringify(object));

  }

  function createJson(root) {
    var thisObj = [];
    if ($(root).prop('tagName') == "UL") {
      var item = {};
      var i = 0;
      $(root).children('li').each(function() {
        item["li" + i] = createJson(this);
        i++;
      });
      thisObj.push(item);
      return thisObj;
    }
    if ($(root).prop('tagName') == "LI") {
      var item = {};
      var i = 0;
      $(root).children('a').each(function() {
        var m = "a" + i;
        item[m] = {};
        item[m]["name"] = $(this).attr("data-name");
        item[m]["age"] = $(this).attr("data-age");
        item[m]["gender"] = $(this).attr("data-gender");
        try {
          item[m]["relation"] = $(this).attr("data-relation");
        } catch (e) {
          item[m]["relation"] = "self";
        }
        item[m]["pic"] = $(this).find('img:first').attr("src");
        i++;
      });

      if ($(root).find('ul:first').length) {
        parent = thisObj;
        item["ul"] = createJson($(root).find('ul:first'));
      }
      thisObj.push(item);
      return thisObj;
    }
  }

/*  function transformTree(tree, familyTree) {
    if (familyTree.children != null) {
      if (familyTree.children[0] != null) {
        for (var index = 0; index < familyTree.children.length; index ++) {
          if (!tree.hasOwnProperty("li" + index)) {
            tree["li" + index] = {};
          }

          tree["li" + index].a0 = familyTree.children[index].name;

          // if ul doesnt exist and its children exists
          if ( !tree["li" + index].hasOwnProperty("ul") ) {
            tree["li" + index].ul = {};
          }

          transformTree( tree["li" + index].ul, familyTree.children[index] );

          //console.log(tree);
        }
      }
    } 
    return tree;

    for (var index = 0 ; index < familyTree.children.length ; index ++) {
      if (!tree.hasOwnProperty("li" + index)) {
        tree["li" + index] = {};
      }

      // if ul doesnt exist and its children exists
      if (!tree["li" + index].hasOwnProperty("ul")) {
        tree["li" + index].ul = {};
      }

      tree["li" + index].a0 = familyTree.name;

      if (familyTree[index].children != null) {
        if (familyTree[index].children[0].name != null) {
          for (var childIndex = 0; childIndex < familyTree[index].children.length; childIndex ++) {
            transformTree(tree["li" + index].ul, familyTree[childIndex])
          }
        }
      }
    }

  //   for (var index = 0; index < familyTree.children.length; index ++) {
  //     if (!tree.hasOwnProperty("li" + index)) {
  //       tree["li" + index] = {};
  //     }
  //     // if ul doesnt exist and its children exists
  //     if (!tree["li" + index].hasOwnProperty("ul")) {
  //       tree["li" + index].ul = {};
  //     }

  //     tree["li" + index].a0 = familyTree.name;

  //     if (familyTree.children[index].children != null) {
  //       if (familyTree.children[index].children[0].name != null) {
  //         transformTree( tree["li" + index].ul, familyTree.children[index]);  
  //       }
  //     } else {
  //       //children was null so skipping whole node here
  //     }
  //      //console.log(tree);
  //   }    
  // return tree;
  }*/


  function transformTree(familyTree) {
    var tree = {},
     parent = "",
     firstLevel = "",
     secondLevel = "";

    tree["li0"] = {}
    tree.li0["a0"] = familyTree.name;
    if (familyTree.children[0].name != null) {
      tree.li0.ul = {}
      // Children
      for (var index1 = 0; index1 < familyTree.children.length; index1++) {
        tree.li0.ul["li" + index1] = {};
        tree.li0.ul["li" + index1].a0 = familyTree.children[index1].name;

        // if grandchildren exists
        if (familyTree.children[index1].parent[0].name != null) {
          tree.li0.ul["li" + index1].ul = {};
          for (var index2 = 0; index2 < familyTree.children[index1].parent.length; index2++) {
            tree.li0.ul["li" + index1].ul["li" + index2] = {};
            tree.li0.ul["li" + index1].ul["li" + index2].a0 = familyTree.children[index1].parent[index2].name;
            
            // if great grandchildren exists
            if (familyTree.children[index1].parent[index2].ggchildren[0].name != null) {
              tree.li0.ul["li" + index1].ul["li" + index2].ul = {};

              for (var index3 = 0; index3 < familyTree.children[index1].parent[index2].ggchildren.length; index3 ++) {
                tree.li0.ul["li" + index1].ul["li" + index2].ul["li" + index3] = {};
                tree.li0.ul["li" + index1].ul["li" + index2].ul["li" + index3].a0 = familyTree.children[index1].parent[index2].ggchildren[index3].name; // changed index from 0 to index3

                //if children of great grand children exists
                if (familyTree.children[index1].parent[index2].ggchildren[index3].childrenOfGreatGrandChild[0].name != null) {
                  tree.li0.ul["li" + index1].ul["li" + index2].ul["li" + index3].ul = {};

                  for (var index4 = 0; index4 < familyTree.children[index1].parent[index2].ggchildren[index3].childrenOfGreatGrandChild.length; index4 ++ ) {
                    tree.li0.ul["li" + index1].ul["li" + index2].ul["li" + index3].ul["li" + index4] = {};
                    tree.li0.ul["li" + index1].ul["li" + index2].ul["li" + index3].ul["li" + index4].a0 = familyTree.children[index1].parent[index2].ggchildren[index3].childrenOfGreatGrandChild[index4].name;

                    // if sixth level children exists
                    if (familyTree.children[index1].parent[index2].ggchildren[index3].childrenOfGreatGrandChild[index4].sixthLevelChildren[0].name != null) {
                      tree.li0.ul["li" + index1].ul["li" + index2].ul["li" + index3].ul["li" + index4].ul = {};
                      for (var index5 = 0; index5 < familyTree.children[index1].parent[index2].ggchildren[index3].childrenOfGreatGrandChild[index4].sixthLevelChildren.length; index5 ++) {
                        tree.li0.ul["li" + index1].ul["li" + index2].ul["li" + index3].ul["li" + index4].ul["li" + index5] = {};
                        tree.li0.ul["li" + index1].ul["li" + index2].ul["li" + index3].ul["li" + index4].ul["li" + index5].a0 = familyTree.children[index1].parent[index2].ggchildren[index3].childrenOfGreatGrandChild[index4].sixthLevelChildren[index5].name;

                        // if seven level children exist
                        if (familyTree.children[index1].parent[index2].ggchildren[index3].childrenOfGreatGrandChild[index4].sixthLevelChildren[index5].seventhLevelChildren != null) {
                          tree.li0.ul["li" + index1].ul["li" + index2].ul["li" + index3].ul["li" + index4].ul["li" + index5].ul = {};

                          for (var index6 = 0; index6 < familyTree.children[index1].parent[index2].ggchildren[index3].childrenOfGreatGrandChild[index4].sixthLevelChildren[index5].seventhLevelChildren.length; index6 ++ ) {
                            tree.li0.ul["li" + index1].ul["li" + index2].ul["li" + index3].ul["li" + index4].ul["li" + index5].ul["li" + index6] = {};
                            tree.li0.ul["li" + index1].ul["li" + index2].ul["li" + index3].ul["li" + index4].ul["li" + index5].ul["li" + index6].a0 = familyTree.children[index1].parent[index2].ggchildren[index3].childrenOfGreatGrandChild[index4].sixthLevelChildren[index5].seventhLevelChildren[index6];
                            seventhLevelNodeCount++;
                          }
                        }
                      }
                    }
                  }
                }
              }  
            }
          }
        }
      }
    }
    return tree;
  }

  function determineUserType(user) {
    if (user.userType_ID === 2) {
      $(".tree-settings-button").hide();
    }
  }

  function setFamilyType(value) {
    $("input[name=tree-type][value=" + value + "]").attr('checked', 'checked');
  }

  window.ansabWebView.init= function init(user) {
    console.log("init called!!!!!");
    var familyTree = "";
    mainUser = user;
    determineUserType(user);
    $.when( $.ajax({
              url: "http://52.33.194.176:8080/fetch-tree",
              type: "POST",
              data: {
                family_ID: user.family_ID
              }
            }), $.ajax({
              url: "http://52.33.194.176:8080/find-members",
              type: "POST",
              data: {
                family_ID: user.family_ID
              }
            }), $.ajax({
              url: "http://52.33.194.176:8080/get-family-type",
              type: "POST",
              data: {
                family_ID: user.family_ID
              }
            }) )
    .then(function( a1, a2, a3 ) {
      // a1 and a2 are arguments resolved for the page1 and page2 ajax requests, respectively.
      // Each argument is an array with the following structure: [ data, statusText, jqXHR ]
      familyTree = {
                      name: a1[0].document.name,
                      children: a1[0].document.kids
                    }
      
      allFamilyMembers = a2[0].rows;

      console.log("all family members");
      console.log(allFamilyMembers);

      var temp = transformTree(familyTree);
      setFamilyType(a3[0].is_ansab_tree);

      $('#pk-family-tree').pk_family_create({
        'data': temp
      });

      // onNodeWidthChange();
      // checkRestrictedWidth();

      navigateToUser();

    },function(error) {
      console.log('when call error');
      console.log(error);
    });

    cacheElements();
    displayFirstForm();
    document.oncontextmenu = function() {
      return false;
    };

    //onNodeWidthChange();
    //checkRestrictedWidth();
  }

  function navigateToUser() {
    var $userNode = $(".node-class[data-ansabid="+mainUser.user_ID+"]");
      $(".node-class").removeClass("node-clicked");
      changeUserPicture();

      $(".node-class[data-ansabid="+mainUser.user_ID+"]").addClass("node-clicked");
      $(".node-class[data-ansabid="+mainUser.user_ID+"]").find(".member-image").attr("src", "images/icon-avt2.png");

      if ($userNode.parents("li").length === 7) {
        $userNode.find(".add-icon-wrapper").hide();
      }
      // animate to selected member

      var elOffset = $(".node-class[data-ansabid="+mainUser.user_ID+"]").offset().top;
      var elHeight = $(".node-class[data-ansabid="+mainUser.user_ID+"]").height();
      var windowHeight = $(window).height();
      var offset;

      if (elHeight < windowHeight) {
        offset = elOffset - ((windowHeight / 2) - (elHeight / 2));
      }
      else {
        offset = elOffset;
      }

      //
      var elOffsetLeft = $(".node-class[data-ansabid="+mainUser.user_ID+"]").offset().left;
      var elWidth = $(".node-class[data-ansabid="+mainUser.user_ID+"]").width();
      var windowWidth = $(window).width();
      var leftOffset;

      if (elWidth < windowWidth) {
        leftOffset = elOffsetLeft - ((windowWidth / 2) - (elWidth / 2));
      }
      else {
        leftOffset = elOffsetLeft;
      }
      //

      var speed = 700;
       $window = $(window),
        $nodeElement = $(".node-class[data-ansabid="+mainUser.user_ID+"]"),
        windowHeight = $("body").height(),
        windowWidth = $window.width(),
        windowScrollLeft = $window.scrollLeft(),
        windowScrollTop = $window.scrollTop(),
        elementOffset = $nodeElement.offset(),
        finalScrollLeft = elementOffset.left - windowWidth/2,
        finalScrollTop = elementOffset.top - windowHeight/4;

      $('html, body').animate({scrollTop:finalScrollTop, scrollLeft: finalScrollLeft}, speed);

      //$('html, body').animate({scrollTop:offset, scrollLeft: leftOffset}, speed);
  }

  function transformMehramMembers(members) {
    var mehram_members = [];
    var mehrams = members[0].mehrams;

    for (var key in mehrams) {
      if (mehrams.hasOwnProperty(key)) {
        for (var index = 0; index < mehrams[key].length; index ++) {
          mehram_members.push(mehrams[key][index].properties.ansab_id);
        }
      }
    }
  }

  function createNewMemberForm() {
    var buttonSave = $("#add-member-submit-button");
    //$(buttonSave).click(saveForm);
    //$(buttonSave).on("click", (saveForm));


    $(".add-member-form-wrapper").on("click", ".submit-button", saveForm);
    //$(buttonSave).attr('value', 'Save');
    /* console.log("creating new member form");
    // ansab form creation
    // ansab form creation ends

    var memberForm = $('<div>').attr('class', 'pk-memberForm');
    var cross = $('<div>').attr('class', 'pk-cross');
    $(cross).text('X');
    $(cross).click(closeForm);
    $(cross).appendTo(memberForm);
    var table = $('<table>').appendTo(memberForm);
    // name
    $('<tr>').html('<td><label>Name</label></td><td><input type="text" value="" id="pk-name"/></td>').appendTo(table);
    $('<tr>').html(' <td><label>Gender</label></td><td><select id="pk-gender"><option value="Male">Male</option><option value="Female">Female</option></select></td>').appendTo(table);
    $('<tr>').html('<td><label>Age</label></td><td><input type="text" value="" id="pk-age"></td>').appendTo(table);
    $('<tr>').html(' <td class="relations"><label>Relation</label></td><td class="relations"><select id="pk-relation">\n\\n\
<option value="Mother">Mother</option>\n\
<option value="Father">Father</option>\n\\n\
<option value="Sibling">Sibling</option>\n\\n\
<option value="Child">Child</option>\n\\n\
<option value="Spouse">Spouse</option>\n\\n\
</select></td>').appendTo(table);
    // $('<tr>').html('<td><label>Upload Photo</label></td><td><input type="file" id="pk-picture"></td>').appendTo(table);
    var buttonSave = $('<input>').attr('type', 'button');
    $(buttonSave).attr('value', 'Save');
    $(buttonSave).click(saveForm);
    var td = $('<td>').attr('colspan', '2');
    td.css('text-align', 'center');
    td.append(buttonSave);
    $('<tr>').append(td).appendTo(table);
    newMemberForm = memberForm;
    $(newMemberForm).appendTo(rootDiv);*/
  }

  function member_details() {
    memberDetails = $('<div>').attr('id', 'pk-member-details');
    $(memberDetails).appendTo(rootDiv);
  }

  function closeEditForm() {
    $(editMemberForm).css('display', 'none');
  }

  function closeForm(event) {
    console.log("closing form");
    event.stopPropagation();
    $addMemberForm.hide();
    currentNode.removeClass("node-clicked");
    changeUserPicture();
    clearInputFieldsAndErrors();

    if (isMemberEdit) {
      isMemberEdit = false;
    }
  }

  function saveForm(event) {
    $(".error-message").css("display", "none");
    $(".form-error").hide();
    $("#pk-mobile-no").removeClass("input-field-error");
    $("#pk-name").removeClass("input-field-error");
    $("#pk-email").removeClass("input-field-error");

    memberName = $('#pk-name').val();
    memberAliveStatus = $("input[name=aliveStatus]:checked").val();
    memberMobileNumber = memberAliveStatus === "true" || isMemberEdit ? $("#pk-mobile-no").val() : new Date().toISOString();
    memberEmail = $("#pk-email").val();
    memberGender = $("input[name=gender]:checked").val();

    newMember = {
      name: memberName,
      mobileNumber: memberMobileNumber,
      family_ID: $(currentNode).attr("data-familyid"),
      gender: memberGender,
      aliveStatus: memberAliveStatus,
      relation: memberRelation === "Father" ? "Parent" : "Child"
    }

    existingMemberId = $(currentNode).attr("data-ansabid");

    // fields validation
    if (memberName === "") {
      $("#pk-name").addClass("input-field-error");
      $("#pk-name").attr("placeholder", "Please enter name");

    } else {
      if (memberAliveStatus === "false") {
        if (!isMemberEdit) {
          addMemberOnBackEnd(existingMemberId, newMember, event);
        } else {
          // doing an ajax here for saving edits
          editMemberOnBackEnd(currentNode.attr("data-ansabid"), memberName, memberGender, memberAliveStatus, memberMobileNumber, memberEmail, event)
          $(currentNode).attr({
            "data-name": memberName,
            "data-gender": memberGender,
            "data-alivestatus": memberAliveStatus,
            "data-mobilenumber": memberMobileNumber,
            "data-email": memberEmail
          });

          $("span", currentNode).text(memberName);
          closeForm(event);
        }
      } else {
        if ((memberMobileNumber === "") || (!mobileNumberRegex.test(memberMobileNumber)) || (memberMobileNumber.length < 8)) {
          $("#pk-mobile-no").addClass("input-field-error");
          $("#pk-mobile-no").val("");
          $("#pk-mobile-no").attr("placeholder", "Please enter valid number");
        } else {
          if (memberEmail === "" || emailRegex.test(memberEmail)) {
            if (!isMemberEdit) {
              addMemberOnBackEnd(existingMemberId, newMember, event);
            } else {
              editMemberOnBackEnd(currentNode.attr("data-ansabid"), memberName, memberGender, memberAliveStatus, memberMobileNumber, memberEmail, event)
              $(currentNode).attr({
                "data-name": memberName,
                "data-gender": memberGender,
                "data-alivestatus": memberAliveStatus,
                "data-mobilenumber": memberMobileNumber,
                "data-email": memberEmail
              });

              $("span", currentNode).text(memberName);
              closeForm(event);
            }
          } else {
              $("#pk-email").addClass("input-field-error");
              $("#pk-email").val("");
              $("#pk-email").attr("placeholder", "Please enter valid email");
          }
        }
      }
    } /*else if ((memberMobileNumber === "") || (!mobileNumberRegex.test(memberMobileNumber))) {
      $("#pk-mobile-no").addClass("input-field-error");
      $("#pk-mobile-no").val("");
      $("#pk-mobile-no").attr("placeholder", "Please enter valid number");
    } else {
      if (memberEmail === "" || emailRegex.test(memberEmail)) {
        if (!isMemberEdit) {
          addMemberOnBackEnd(existingMemberId, newMember, event);
          //addMember();
          // closeForm(event);
        } else {
          // doing an ajax here for saving edits
          editMemberOnBackEnd(currentNode.attr("data-ansabid"), memberName, memberGender, memberAliveStatus, memberMobileNumber, memberEmail, event)
          $(currentNode).attr({
            "data-name": memberName,
            "data-gender": memberGender,
            "data-alivestatus": memberAliveStatus,
            "data-mobilenumber": memberMobileNumber,
            "data-email": memberEmail
          });

          $("span", currentNode).text(memberName);
          closeForm(event);
        }

        
      } else {
        $("#pk-email").addClass("input-field-error");
        $("#pk-email").val("");
        $("#pk-email").attr("placeholder", "Please enter valid email");
      }
    }*/
  }

  function displayErrorMessage(message) {
    $(".error-message").text(message);
    $(".error-message").css("display", "block");
  }

  function addBreadingGround() {
    var member = $('<div>').attr('id', 'treeGround');
    $(member).attr('class', 'tree-ground');
    $(member).appendTo(rootDiv);
    treeGround = member;
    // $(treeGround).draggable();
  }

  function addMemberButton() {
    console.log("inside addMemberbutton");
    var member = $('<input>').attr('type', 'button');
    $(member).attr('value', 'Add Member');
    $(member).click(displayForm);
    $(member).appendTo(rootDiv);
  }

  function displayForm(input) {
    displayAddNewMemberForm(currentNode);
  }

  function displayAddNewMemberForm(parent) {
    $(".add-member-form-wrapper").css("display", "block");

    //onNodeWidthChange();
    //checkRestrictedWidth();

    if (isMemberEdit) {
      var aliveStatus = parent.attr("data-alivestatus");
      if (aliveStatus === "false") {
        disableMobileAndEmailField(true);
      }
      $(".form-heading").text("Edit Family Member");
      $("#pk-name").val(parent.attr("data-name"));
      $("#pk-mobile-no").val(aliveStatus === "true" || parent.attr("data-mobilenumber").charAt(0) === "+" ? parent.attr("data-mobilenumber") : "");
      $("#pk-email").val(aliveStatus === "true" ? parent.attr("data-email") : "");
      $('input:radio[name=gender]').val([parent.attr("data-gender")]);
      $('input:radio[name=aliveStatus]').val([parent.attr("data-alivestatus")]);
    } else {
      $(".form-heading").text("Add Family Member");
    }
  }


  function displayEditForm(input) {
    cacheElements();
    $('.relations').css('display', '');
    $(editMemberForm).css('display', 'block');
    updateFieldValues();
  }

  function updateFieldValues() {
    $($editFormName).val(currentNode.attr('data-name'));
    $($editFormGender).val(currentNode.attr('data-gender'));
    $($editFormAge).val(currentNode.attr('data-age'));
    $($editFormRelation).val(currentNode.attr('data-relation'));
  }

  function displayPopMenu(input, event) {
    if (($(options_menu).css('display') == 'none') && ($(".dropdown-add-member", input).css('display') === "none")) {
      selectedMember = input;
      self = false;
      $(options_menu).css('display', 'block');
      $(options_menu).css('top', event.clientY);
      $(options_menu).css('left', event.clientX);
    }
  }

  function displayFirstForm() {
    selectedMember = null;
    self = true;
    $('.relations').css('display', 'none');
    $(newMemberForm).css('display', 'block');
    $('#pk-relation').val('Main');
  }

  function addMember(user_ID, family_ID) {
    var aLink = $('<a>').attr('href', '#');
    var center = $('<center>').appendTo(aLink);
    var pic = $('<img>').attr('src', 'images/icon-avt1.png');
    $(pic).addClass("member-image");
    $(aLink).addClass("node-class");

    $(aLink).append("<div class='delete-icon-wrapper'><i class='fa fa-times delete-member-icon' aria-hidden='true'></i></div>");
    $(aLink).append("<div class='edit-icon-wrapper'><i class='fa fa-pencil edit-member-icon' aria-hidden='true'></i></div>");
    $(aLink).append("<div class='add-icon-wrapper'><i class='fa fa-plus-circle add-member-icon' aria-hidden='true'></i></div>");
    
    if (memberRelation === "Father") {
      $(aLink).append("<div class='add-parent-icon-wrapper'><i class='fa fa-plus-circle add-parent-icon' aria-hidden='true'></i></div>");
    }

    //adding invisible div at the end which will contain add new member form
    $(aLink).append("<div class='dropdown-add-member'></div>");

    //

    var extraData = "";
    if (memberGender == "Male") {
      extraData = "(M)";
    } else {
      extraData = "(F)";
      $(pic).attr('src', 'images/icon-avt1.png');
    }
    $(pic).appendTo(center);
    $(center).append($('<br>'));

    var $childSpan = $('<span>');
    $childSpan.html(memberName).appendTo(center);
    $childSpan.addClass("member-name");

    var li = $('<li>').append(aLink);
    $(li).addClass("parent-node");

    $(aLink).attr('data-ansabid', user_ID);
    $(aLink).attr('data-familyid', family_ID);
    $(aLink).attr('data-name', memberName);
    $(aLink).attr('data-gender', memberGender);
    $(aLink).attr('data-relation', memberRelation);
    $(aLink).attr('data-alivestatus', memberAliveStatus);
    $(aLink).attr('data-mobilenumber', memberMobileNumber);

    var sParent = $(selectedMember).parent(); // super parent
    if (selectedMember != null) {
      if (memberRelation == 'Mother') {

      }
      if (memberRelation == 'Spouse') {
        $(aLink).attr('class', 'spouse');
        var toPrepend = $(sParent).find('a:first');
        $(sParent).prepend(aLink);
        $(sParent).prepend(toPrepend);
      }
      if (memberRelation == 'Child') {
        var toAddUL = $(sParent).find('UL:first');
        if ($(toAddUL).prop('tagName') == 'UL') {
          $(toAddUL).append(li);
        } else {
          var ul = $('<ul>').append(li);
          $(sParent).append(ul);
        }

      }
      if (memberRelation == 'Sibling') {
        $(sParent).parent().append(li);

      }
      if (memberRelation == 'Father') {
        var parent = $(sParent).parent();
        var parentParent = $(parent).parent();
        var ul = $('<ul>').append(li);
        $(parent).appendTo(li);
        $(parentParent).append(ul);
      }
    } else {
      var ul = $('<ul>').append(li);
      $(treeGround).append(ul);
    }

    if ($(li).parents("li").length === 6) {
      console.log("its a seventh node");
      seventhLevelNodeCount++;
    }

    onNodeWidthChange();
    checkRestrictedWidth();

  }

  function displayFormError(errorMessage) {
    var $errorText = $(".form-error-text");
    $errorText.html(errorMessage);
    $(".form-error").show();
  }

  function checkTreeDepth(treeDepth) {
    levels = treeDepth.treeDepth;
    if (levels.indexOf(7) > -1) {
      console.log("tree is 7 level");
      maxTreeLevelReached = true;
    } else {
      console.log("not seven level");
      maxTreeLevelReached = false;
    }
  }

  function addMemberOnBackEnd(existingMember, newMember, event) {
    console.log("adding member on be");
    $.ajax({
      url: "http://52.33.194.176:8080/create-user",
      type: "POST",
      data: {
        existingMember: existingMember,
        newMember: newMember
      },
      success: function(res) {
        $.ajax({
          url: "http://52.33.194.176:8080/get-depth",
          type: "POST",
          data: {
          family_ID: mainUser.family_ID
          },
          success: function(treeDepth) {
            console.log("member added successfully on backend");
            closeForm(event);
            addMember(res.user_ID, res.family_ID);
            checkTreeDepth(treeDepth);
          },
          error: function(err) {
            console.log(err);
            //console.log("failed to add member");
            //console.log(err.responseText);
            //displayFormError(err.responseText);
          }
        });
        //console.log("member added successfully on backend");
        //closeForm(event);
        //addMember(res.user_ID, res.family_ID);
      },
      error: function(err) {
        console.log("failed to add member");
        console.log(err.responseText);
        displayFormError(err.responseText);
      }
    });
  }

  function editMemberOnBackEnd(ansab_id, name, gender, aliveStatus, mobileNumber, email, event) {
    $.ajax({
      url: "http://52.33.194.176:8080/edit-user",
      type: "POST",
      data: {
        user_ID: ansab_id,
        username: name,
        gender: gender,
        is_alive: aliveStatus,
        phone: mobileNumber,
        email: email
      },
      success: function(res) {
        console.log("member edited succesfully");
        console.log(res);
      },
      error: function(err) {
        console.log(err)
      }
    });
  }
 
  function removeMemberFromBackEnd(member_ansab_id) {
    $.ajax({
      url: "http://52.33.194.176:8080/delete-member",
      type: "POST",
      data: {
        user_ID: member_ansab_id
      },
      success: function(res) {
         $.ajax({
          url: "http://52.33.194.176:8080/get-depth",
          type: "POST",
          data: {
          family_ID: mainUser.family_ID
          },
          success: function(treeDepth) {
            console.log("member deleted successfully on backend");
            removeMember(currentNode);
            checkTreeDepth(treeDepth);
          },
          error: function(err) {
            console.log(err);
            //console.log("failed to add member");
            //console.log(err.responseText);
            //displayFormError(err.responseText);
          }
        });
        //removeMember(currentNode);
      },
      error: function(err) {
        console.log(err)
      }
    });
  }

  // will show existing user info
/*  function displayData(element) {
    var innerContent = $('<table>');
    var content = '';
    var cross = $('<div>').attr('class', 'pk-cross');
    $(cross).text('X');
    $(cross).click(function() {
      $(memberDetails).css('display', 'none')
    });
    $(memberDetails).empty();
    $(cross).appendTo(memberDetails);
    content = content + '<tr><td>Name</td><td>' + $(element).attr('data-name') + '</td></tr>';
    content = content + '<tr><td>Age</td><td>' + $(element).attr('data-age') + '</td></tr>';
    content = content + '<tr><td>Gender</td><td>' + $(element).attr('data-gender') + '</td></tr>';
    if ($(element).attr('data-relation')) {
      content = content + '<tr><td>Relation</td><td>' + $(element).attr('data-relation') + '</td></tr>';
    } else {
      content = content + '<tr><td>Relation</td><td>Self</td></tr>';
    }
    content = content + '<tr><td colspan="2" style="text-align:center;"><img src="' + $(element).find('img').attr('src') + '"/></td></tr>';
    $(innerContent).html(content);
    $(memberDetails).append(innerContent);
    $(memberDetails).css('display', 'block');
  }*/

/*  function readImage(input, pic) {
    var files = $(input).prop('files');
    if (files && files[0]) {
      var reader = new FileReader();

      reader.onload = function(e) {
        $(pic).attr('src', e.target.result);
      }

      reader.readAsDataURL(files[0]);
    }
  }
*/
  function removeMember(member) {
    console.log("removing member on frontend");
    var $currentNode = $(member).closest('li'),
      parentWidth = $("#treeGround").width(),
      nodeWidth = $currentNode.width();

      if ($(member).parents("li").length === 7) {
        console.log("it was a seventh level node");
        seventhLevelNodeCount--;
      }

    if ($(member).attr('data-relation') == 'Sibling') {
      $(currentNode).parent().remove();
    }
    if ($(member).attr('data-relation') == 'Child') {
      console.log("inside data-relation is child");
      var cLen = $currentNode.parent().children('li').length;
      if (cLen > 1)
        $currentNode.remove();
      else {
        $currentNode.parent().remove();
      }
    }
    if ($(member).attr('data-relation') == 'Parent') {
      console.log("data-relation is father");
      var child = $(currentNode).children('ul');
      var parent = $(currentNode).parent().parent();
      $(child).appendTo(parent);
      $(currentNode).remove();
    }
    if ($(member).attr('data-relation') == 'Spouse') {
      $(currentNode).remove();
    }

    $("#treeGround").css("width", parentWidth - nodeWidth);

  }

  function onNodeWidthChange(nodeWidth) {
    restrictedWidth = $("#treeGround > ul").width();
  }

  function checkRestrictedWidth() {
    var treeWidth = $(".tree-ground").width();
    if ((treeWidth - 50) < restrictedWidth) {
      // change the value to 100 if tree width issue arise
      $(".tree-ground").css("width", restrictedWidth + 100);
    }
  }


  //Zoom in and out

  $(document).ready(function() {
    //init();
 
    $('#zoom-in').click(function() {
      if (zoomLevel < 1.4) {
        updateZoom(0.2);
      } else {
        $("#zoom-in").addClass("zoom-button-disabled");
        $("#zoom-out").removeClass("zoom-button-disabled");
      }
    });

    $('#zoom-out').click(function() {
      if (zoomLevel > 0.8) {
        updateZoom(-0.2);
      } else {
        $("#zoom-out").addClass("zoom-button-disabled");
        $("#zoom-in").removeClass("zoom-button-disabled");
      }
    });

  });

  zoomLevel = 1;

  var updateZoom = function(zoom) {
    zoomLevel += zoom;
    if (zoomLevel < 1.4) {
      $("#zoom-in").removeClass("zoom-button-disabled");
    }

    if (zoomLevel > 0.8) {
      $("#zoom-out").removeClass("zoom-button-disabled");
    }

    $('#treeGround').css({
      zoom: zoomLevel,
      '-moz-transform': 'scale(' + zoomLevel + ')'
    });

    onNodeWidthChange();
    checkRestrictedWidth();
  }
}(jQuery));